# Glossary

Draft recovered vocabulary for this article refresh. Existing public and protocol names are preserved.
No prior glossary was found. This file does not rename product concepts or certify product capabilities.

## Map

| Term | Owner or source | Relationship | Customer word |
| --- | --- | --- | --- |
| Request Indexing | site.name and public brand | Product using several Google interfaces | Request Indexing |
| Site | sites table, dashboard/site route | Connected property represented in the product | Site |
| Team | teams table, dashboard/team route | Membership and Site access context | Team |
| Google Search Console property | Google property model | Google scope for ownership and inspection | property |
| Indexing API notification | Google urlNotifications resource | Reports a changed/deleted eligible URL | notification |
| URL Inspection | Google Search Console tool/API | Reports index information; manual tool also offers a request | URL Inspection |
| crawling | Google Search process | Fetch precedes possible indexing | crawling |
| indexing | Google Search process | Inclusion decision after processing | indexing |
| signup | users table, /pro/onboarding | Account creation for a person | signup |
| onboarding | onboarding wizard, users.onboarding_completed_at | First-run setup an account completes once | setup |
| connect | Connect site controls, registerSite | Attaching a Site to a Team | connect |
| funnel milestone | pro_events table | First-time record of one step toward an active account | (internal) |

Collisions: the product's submission history and Google's indexing state are different evidence. Never imply one proves the other.

## Terms

### Request Indexing
**Is:** the product brand.
**Use for:** product references.
**Never:** RequestIndexer as an invented brand synonym.
**Casing:** Request Indexing.

### Site and Team
**Is:** existing dashboard concepts backed by sites and teams.
**Use for:** the corresponding product objects, with ordinary lowercase site/team in generic discussion.
**Never:** project as a substitute for a product Site. Google Cloud project remains its own term.
**Casing:** Match the visible product label when naming a control.

### Indexing API notification
**Is:** a URL_UPDATED or URL_DELETED notification sent to Google's Indexing API.
**Use for:** API receipt and metadata examples.
**Never:** indexed page, completed crawl, or indexing confirmation as synonyms for an accepted notification.
**Casing:** Indexing API; exact protocol literals remain uppercase.

### URL Inspection
**Is:** Google's inspection tool or API, identified explicitly when the distinction matters.
**Use for:** reading index information; only the manual tool offers its request-indexing action.
**Never:** Indexing API as a synonym.
**Casing:** URL Inspection.

### Crawling and indexing
**Is:** separate Google processes. Crawling fetches content; indexing determines inclusion.
**Use for:** the process supported by the evidence.
**Never:** interchangeable results of HTTP200.
**Casing:** lowercase in ordinary prose.

### Signup and onboarding
**Is:** signup creates the account; onboarding is the first-run setup the account completes once.
**Use for:** the two separate steps, named separately.
**Never:** registration or sign-up as a synonym for signup. Never wizard alone for onboarding.
**Casing:** lowercase in prose.

### Connect
**Is:** the act of attaching a Site to a Team. Every control in the product says Connect.
**Use for:** prose and labels about attaching a Site.
**Never:** add, create, or register a Site in prose or in a label. Code keeps `registerSite` and the `site_added` value.
**Casing:** Match the visible label when naming a control.

### Funnel milestone
**Is:** one first-time row in `pro_events` marking a step toward an active account.
**Use for:** internal analysis of signup, connect, and onboarding steps.
**Never:** conversion event or activation event as synonyms. This term is internal and has no customer word.
**Casing:** lowercase in prose; stored values stay snake_case.

## Banned

| Never | Use instead | Why |
| --- | --- | --- |
| indexed successfully for an accepted notification | notification accepted | Receipt does not establish indexing. |
| guaranteed indexing | exact observed or documented outcome | No reviewed source establishes a guarantee. |

These restrictions apply to prose meanings, not stored enum values or existing route segments.

## Open questions

No naming redesign is proposed. This is a bounded article glossary, not an exhaustive app audit.
The existing UI uses submission labels; keep exact labels in procedures and distinguish them from Google's index state in explanations.
Root coordinator accepted this bounded article vocabulary on 15 September 2026 before drafting. No app-wide audit is claimed.
