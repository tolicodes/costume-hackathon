import unittest, json
from unittest.mock import patch
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import server

class AppTests(unittest.TestCase):
    def request(self,path,body):
        req=Request('http://127.0.0.1:3000'+path,json.dumps(body).encode(),{'Content-Type':'application/json'})
        with urlopen(req) as r: return json.load(r)
    def test_demo_journey(self):
        plan=self.request('/api/ideas',{'event':'Garden party','demo':True})
        self.assertEqual(len(plan['ideas']),4)
        self.assertTrue(plan['demo'])
        pieces=self.request('/api/pieces',{'planId':plan['id'],'index':2})
        self.assertEqual(pieces['name'],plan['ideas'][2]['name'])
        self.assertGreaterEqual(len(pieces['pieces']),3)
        self.assertTrue(all(not p['sources'] for p in pieces['pieces']))
        self.assertEqual(pieces['sourceMode'],'google-lens')
    def test_invalid_event(self):
        with self.assertRaises(HTTPError) as ctx:self.request('/api/ideas',{'event':'','demo':True})
        self.assertEqual(ctx.exception.code,400)
    def test_unknown_plan(self):
        with self.assertRaises(HTTPError) as ctx:self.request('/api/pieces',{'planId':'missing','index':0})
        self.assertEqual(ctx.exception.code,400)
    def test_nimble_contract_and_url_filter(self):
        with patch.dict(server.os.environ,{'NIMBLE_API_KEY':'test'}),patch('server.post',return_value={'results':[{'title':'Item','url':'https://www.etsy.com/listing/item','description':'Available'},{'url':'javascript:alert(1)'}]}) as mock:
            result=server.search('silver boots',True)
            self.assertEqual(len(result),1)
            self.assertEqual(set(result[0]['searchTypes']),{'shopping','general'})
            payloads=[call.args[2] for call in mock.call_args_list]
            self.assertEqual({p['focus'] for p in payloads},{'shopping','general'})
            self.assertTrue(all(p['include_domains']==['amazon.com','etsy.com'] for p in payloads))
            self.assertTrue(all(call.kwargs['timeout']==120 for call in mock.call_args_list))
            self.assertEqual(mock.call_args.args[0],'https://sdk.nimbleway.com/v2/search')
    def test_model_contract(self):
        expected=server.demo('test')
        with patch.dict(server.os.environ,{'OPENAI_API_KEY':'test'}),patch('server.post',return_value={'output':[{'content':[{'type':'output_text','text':json.dumps(expected)}]}]}) as mock:
            result=server.generate('test',[])
            self.assertEqual(len(result['ideas']),4)
            self.assertTrue(mock.call_args.args[2]['text']['format']['strict'])

    def test_marketplace_filter(self):
        self.assertTrue(server.marketplace_url('https://www.amazon.com/item'))
        self.assertTrue(server.marketplace_url('https://etsy.com/listing/1'))
        self.assertFalse(server.marketplace_url('https://amazon.com.evil.example/item'))
        self.assertFalse(server.marketplace_url('https://other.example/item'))

    def test_parallel_discovery_partial_failure(self):
        from threading import Barrier
        barrier=Barrier(2)
        def provider(url,key,payload,**kwargs):
            barrier.wait(timeout=2)
            if payload['focus']=='shopping': raise ValueError('shopping timeout')
            return {'results':[{'title':'Found','url':'https://www.etsy.com/listing/item'}]}
        with patch.dict(server.os.environ,{'NIMBLE_API_KEY':'test'}),patch('server.post',side_effect=provider):
            self.assertEqual(len(server.search('item',True)),1)

if __name__=='__main__':unittest.main()
