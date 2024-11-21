// // pages/api/analyzetext/route.js
// import axios from 'axios';

// export default async function handler(req, res) {
//   // CORS 헤더 설정
//   res.setHeader('Access-Control-Allow-Credentials', true);
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
//   res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

//   if (req.method === 'OPTIONS') {
//     res.status(200).end();
//     return;
//   }

//   if (req.method === 'POST') {
//     const { text } = req.body;
//     const ETRI_API_KEY = process.env.ETRI_API_KEY;

//     const requestJson = {
//       'argument': {
//         'text': text,
//         'analysis_code': 'ner'
//       }
//     };

//     try {
//       const response = await axios.post(
//         'http://aiopen.etri.re.kr:8000/WiseNLU',
//         requestJson,
//         {
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': ETRI_API_KEY
//           }
//         }
//       );
//       res.status(200).json(response.data);
//     } catch (error) {
//       console.error('Error:', error);
//       res.status(500).json({ error: 'Error analyzing text', details: error.message });
//     }
//   } else {
//     res.setHeader('Allow', ['POST']);
//     res.status(405).end(`Method ${req.method} Not Allowed`);
//   }
// }