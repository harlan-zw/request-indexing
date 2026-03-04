import urllib.request
import urllib.parse
from html.parser import HTMLParser

class DDGParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.in_result = False

    def handle_starttag(self, tag, attrs):
        if tag == 'a':
            attrs_dict = dict(attrs)
            if 'class' in attrs_dict and 'result-snippet' in attrs_dict['class']:
                self.links.append(attrs_dict.get('href'))

def search(query):
    data = urllib.parse.urlencode({'q': query}).encode('utf-8')
    req = urllib.request.Request("https://lite.duckduckgo.com/lite/", data=data, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        html = urllib.request.urlopen(req).read().decode('utf-8')
        parser = DDGParser()
        parser.feed(html)
        for link in set(parser.links):
            if link.startswith('http'):
                print(link)
    except Exception as e:
        print(e)

search('site:seroundtable.com "John Mueller" AND "Indexing API"')
