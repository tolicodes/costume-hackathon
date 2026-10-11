import unittest,json,io
from unittest.mock import patch
import server
class CropTests(unittest.TestCase):
 def test_invalid_boxes(self):
  for box in (None,[],[0,0,0,0],[0,-1,500,500],[0,0,1001,1000],[0,0,True,1000],[0,0,float('nan'),500]):
   self.assertIsNone(server.valid_box(box))
  self.assertEqual(server.valid_box([10,20,600,800]),[10,20,600,800])
 def test_absent_low_confidence_and_invalid_piece(self):
  rows=[{'pieceIndex':0,'box':[100,100,800,800],'visible':True,'confidence':.9},
        {'pieceIndex':1,'box':[0,0,200,200],'visible':True,'confidence':.3},
        {'pieceIndex':2,'box':[0,0,900,900],'visible':False,'confidence':.9},
        {'pieceIndex':99,'box':[0,0,900,900],'visible':True,'confidence':.9}]
  response={'candidates':[{'content':{'parts':[{'text':json.dumps(rows)}]}}]}
  with patch.dict(server.os.environ,{'GEMINI_API_KEY':'test'}),patch('server.urlopen',return_value=io.BytesIO(json.dumps(response).encode())):
   result=server.locate_pieces(server.demo('test')['ideas'][0],{'dataUrl':'data:image/png;base64,aGVsbG8='})
  self.assertFalse(result[0]['needsReview']);self.assertTrue(result[1]['needsReview'])
  self.assertIsNone(result[2]['box']);self.assertIsNone(result[3]['box'])
 def test_adjusted_crop_changes_public_image_without_mutating_original(self):
  import base64,tempfile
  from pathlib import Path
  from PIL import Image
  with tempfile.TemporaryDirectory() as directory:
   root=Path(directory);(root/'.cache').mkdir();(root/'.cache/public-crop-url').write_text('https://public.example')
   crops=root/'crops';crops.mkdir()
   output=io.BytesIO();Image.new('RGB',(100,100),'green').save(output,format='PNG')
   image={'dataUrl':'data:image/png;base64,'+base64.b64encode(output.getvalue()).decode()}
   saved={'crops':[{'pieceIndex':0,'box':[0,0,1000,1000]}]}
   with patch('server.ROOT',root),patch('server.PUBLIC_CROPS',crops):
    first=server.public_crop_links(saved,image)
    self.assertNotIn('publicUrl',saved['crops'][0])
    saved['crops'][0]['box']=[0,0,500,500]
    second=server.public_crop_links(saved,image)
    self.assertNotEqual(first['crops'][0]['publicUrl'],second['crops'][0]['publicUrl'])
    self.assertEqual(len(list(crops.glob('*.png'))),2)
