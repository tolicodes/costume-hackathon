import io,json,time,unittest
from unittest.mock import patch
import server
class LensTests(unittest.TestCase):
 def test_visual_matches_contract_and_filter(self):
  payload={'visual_matches':[{'title':'Suit','link':'https://shop.example/products/suit','thumbnail':'https://image.example/a.jpg','price':{'value':'$48*'},'in_stock':True}, {'title':'Duplicate','link':'https://shop.example/products/suit?tracking=1','thumbnail':'https://image.example/a.jpg'},{'title':'Social','link':'https://instagram.com/p/1','thumbnail':'https://image.example/a.jpg','price':'$2'},{'link':'javascript:alert(1)','thumbnail':'https://image.example/a.jpg','price':'$2'}]}
  with patch.dict(server.os.environ,{'SERPAPI_API_KEY':'test-secret'}),patch('server.artifact',return_value=None),patch('server.urlopen',return_value=io.BytesIO(json.dumps(payload).encode())) as call:
   result=server.lens_matches('https://public.example/abcdef.png')
   self.assertEqual(len(result['sources']),1)
   self.assertEqual(result['sources'][0]['price'],'$48*')
   self.assertTrue(result['sources'][0]['inStock'])
   from urllib.parse import urlparse,parse_qs
   params=parse_qs(urlparse(call.call_args.args[0].full_url).query)
   self.assertEqual(params['engine'],['google_lens'])
   self.assertEqual(params['type'],['visual_matches'])
   self.assertEqual(call.call_args.kwargs['timeout'],120)
 def test_cache_and_errors(self):
  with patch.dict(server.os.environ,{'SERPAPI_API_KEY':'test'}),patch('server.artifact',return_value={'created':time.time(),'sources':[]}),patch('server.urlopen') as call:
   self.assertTrue(server.lens_matches('https://example.com/a.png')['cached']);call.assert_not_called()
  with patch.dict(server.os.environ,{'SERPAPI_API_KEY':'test'}),patch('server.artifact',return_value=None) as cache,patch('server.urlopen',return_value=io.BytesIO(b'{"error":"bad test"}')):
   with self.assertRaisesRegex(ValueError,'bad'):
    server.lens_matches('https://example.com/a.png')
   self.assertEqual(cache.call_count,1)
 def test_no_results_is_cached_as_empty(self):
  payload={"error":"Google Lens hasn't returned any results for this query."}
  with patch.dict(server.os.environ,{'SERPAPI_API_KEY':'test'}),patch('server.artifact',return_value=None) as cache,patch('server.urlopen',return_value=io.BytesIO(json.dumps(payload).encode())):
   result=server.lens_matches('https://example.com/empty.png')
   self.assertEqual(result['sources'],[])
   self.assertEqual(cache.call_count,2)
   self.assertEqual(cache.call_args.args[3]['sources'],[])
