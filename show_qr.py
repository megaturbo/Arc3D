import qrcode
import sys
import json
import urllib.request

PORT = ':8000'

request = urllib.request.Request('http://jsonip.com')
response = urllib.request.urlopen(request)
str_response = response.read().decode('utf-8')
public_ip = json.loads(str_response)['ip']
content = public_ip + PORT

print(content)
img = qrcode.make(content)
img.show()
