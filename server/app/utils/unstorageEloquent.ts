import type { Storage } from 'unstorage'
import { prefixStorage } from 'unstorage'
import { hash } from 'ohash'
import { klona } from 'klona'
import { createDefu } from 'defu'

type ModelData = Record<string, any>

export type AsInput<T extends ModelData> = Partial<T>

export interface ModelMethods<T extends ModelData> {
  getKey: () => string
  isDirty: () => boolean
  getAttributes: () => T
  fill: (data: AsInput<T>) => Model<T>
  update: (changes: Partial<T>) => Promise<Model<T>>
  increment: (prop: keyof T, amount?: number) => Promise<Model<T>>
  delete: () => Promise<void>
  save: () => Promise<Model<T>>
}

export type Model<T extends ModelData> = T & ModelMethods<T>
export type ModelWithFns<T extends ModelData, M extends (instance: Model<T>) => Record<string, Function>> = T & ModelMethods<T> & ReturnType<M>

export interface OrmOptions<T> {
  schema: T
  tableName: string
  keyName: string
  // storage: Storage
  // as: string
  // encrypted?: boolean
}

export const defaultMerge = createDefu((data, key, value) => {
  // we want to override arrays when an empty one is provided
  if (Array.isArray(data[key]) && Array.isArray(value)) {
    data[key] = value
    return true
  }
})

function createModel<T extends Record<string, any>>(_attributes: T, options: OrmOptions<T>): Model<T> {
  const baseStorage = prefixStorage(options.storage as Storage<T>, options.tableName)
  // safe augmenting
  const attributes = klona(_attributes)

  // assign the methods to the instance
  return new Proxy({
    _methods: [],
    _new: true,
    getKey() {
      return attributes[options.keyName] || _attributes[options.keyName]
    },
    isDirty() {
      return hash(attributes) !== hash(_attributes)
    },
    fill(data: AsInput<T>) {
      for (const key in data)
        attributes[key] = defaultMerge({ value: data[key] }, { value: attributes[key] }).value
      return this
    },
    getAttributes() {
      return attributes
    },
    async delete() {
      const keys = await baseStorage.getKeys()
      for (const key of keys)
        await baseStorage.removeItem(key)
    },
    async save() {
      attributes.updatedAt = Date.now()
      const toSave = klona(attributes)
      // filter out undefined values
      for (const key in toSave) {
        if (toSave[key] === undefined || _attributes[key] === toSave[key])
          delete toSave[key]
      }
      if (!this._new) {
        await useDrizzle()
          .update(options.schema)
          .set(toSave)
          .where(eq(options.keyName, this.getKey()))
      }
      else {
        await useDrizzle()
          .insert(options.schema)
          .values(toSave)
        this._new = false
      }
      return this
    },
    async increment(prop: keyof T, amount = 1) {
      attributes[prop] = (attributes[prop] || 0) + amount
      return this.save()
    },
    async update(changes: Partial<T>) {
      Object.assign(attributes, changes)
      return this.save()
    },
  }, {
    // handle function calls to _resolvedFns
    // we need to return the modeldata if the property is not found, we allow augmenting the data
    get(target, prop) {
      if (prop in target)
        // @ts-expect-error runtime
        return target[prop]
      if (prop in target._methods)
        // @ts-expect-error runtime
        return target._methods[prop]
      // @ts-expect-error runtime
      return attributes[prop]
    },
    // support sets, we should modify "data" if it's not known, avoid modifying the object itself
    set(target, prop, value) {
      if (prop in target)
        // @ts-expect-error runtime
        target[prop] = value
      else if (prop in target._methods)
        // @ts-expect-error runtime
        target._methods[prop] = value
      else
      // @ts-expect-error runtime
        attributes[prop] = value
      return true
    },
  }) as any as Model<T>
}

interface Orm<T extends ModelData> extends T {
  options: OrmOptions<T>
  newModelInstance: (attributes?: Partial<T>) => Model<T>
  findOrFail: (id: string) => Promise<Model<T>>
  find: (id: string) => Promise<Model<T> | null>
  update: (id: string, changes: Partial<T>) => Promise<Model<T>>
  exists: (id: string) => Promise<boolean>
  create: (data: Partial<T>) => Promise<Model<T>>
  withMethods: <M extends (instance: Model<T>) => any>(methods: M) => Orm<T & ReturnType<M>>
  withEventListeners: (listeners: Record<'saving' | 'retrieved', (instance: Model<T>) => void | Promise<void>>) => Orm<T>
}

export function defineModel<T extends Record<string, any>>(options: OrmOptions<T>): Orm<T> {
  return {
    options,
    newModelInstance(_attributes?: T) {
      return createModel(_attributes || {} as T, options)
    },
    async findOrFail(id: string) {
      const model = await this.find(id)
      if (!model)
        throw new Error(`Model not found: ${id}`)
      return model
    },
    async find(id: string) {
      const attributes = await useDrizzle()
        .select()
        .from(options.schema)
        .where(sql`${options.keyName} = ${id}`)
      if (attributes[0]) {
        const instance = this.newModelInstance(attributes as any as T)
        instance._new = false
        return instance
      }
      return null
    },
    async update(id: string, _changes: Partial<T>) {
      const changes = klona(_changes)
      // need to find and then patch the data with changes
      let model = await this.find(id)
      if (model)
        model.fill(changes)
      else
        model = this.newModelInstance().fill({ ...changes, [options.keyName]: id })
      return model.save()
    },
    async exists(id: string) {
      return !!(await this.find(id))
    },
    create(data: AsInput<T>) {
      const model = this.newModelInstance()
      model.fill({
        // free overrides
        [options.keyName]: hash({ options, time: data.createdAt }),
        createdAt: Date.now(),
        ...klona(data),
      })
      return model.save()
    },
    withMethods<M extends (instance: Model<T & ReturnType<M>>) => any>(methods: M): Orm<T & ReturnType<M>> {
      const newModelInstance = this.newModelInstance
      // @ts-expect-error untyped
      return Object.assign(this, {
        newModelInstance() {
          const instance = newModelInstance()
          instance._methods = methods(instance as Model<T & ReturnType<M>>)
          return instance
        },
      })
    },
    withEventListeners(listeners: Record<'saving' | 'retrieved', (instance: Model<T>) => void | Promise<void>>) {
      // need to hook into newModelInstance
      const newModelInstance = this.newModelInstance
      const find = this.find
      return Object.assign(this, {
        async find(id: string) {
          const model = await find.call(this, id)
          if (model) {
            if (listeners.retrieved)
              await listeners.retrieved(model)
          }
          return model
        },
        newModelInstance() {
          const instance = newModelInstance()
          // need to stub out the find method
          // need to stub out the save method
          const save = instance.save
          instance.save = async function () {
            if (listeners.saving)
              await listeners.saving(instance)
            await save.call(instance)
            return instance
          }
          return instance
        },
      })
    },
  }
}
