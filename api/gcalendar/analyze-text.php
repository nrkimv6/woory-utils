<?php
function analyzeText($text) {
    $openApiURL = "http://aiopen.etri.re.kr:8000/WiseNLU";
    $accessKey = "84af26f6-56f5-4934-8a8a-9750ffe736c2";
    $analysisCode = "ner";  // Named Entity Recognition

    $requestJson = [
        "access_key" => $accessKey,
        "argument" => [
            "text" => $text,
            "analysis_code" => $analysisCode
        ]
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $openApiURL);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestJson));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

    $response = curl_exec($ch);
    curl_close($ch);

    $responseData = json_decode($response, true);

    if (isset($responseData['result'])) {
        
        $namedEntities = $responseData['result'];
        
        $extractedInfo = [
            "dates" => [],
            "times" => [],
            "locations" => [],
            "organizations" => []
        ];

        foreach ($namedEntities['sentence'] as $sentence) {
            foreach ($sentence['NE'] as $ne) {
                switch ($ne['type']) {
                    case 'DT':  // Date
                        $extractedInfo["dates"][] = $ne['text'];
                        break;
                    case 'TI':  // Time
                        $extractedInfo["times"][] = $ne['text'];
                        break;
                    case 'LC':  // Location
                        $extractedInfo["locations"][] = $ne['text'];
                        break;
                    case 'OG':  // Organization
                        $extractedInfo["organizations"][] = $ne['text'];
                        break;
                }
            }
        }
        return $namedEntities;

        // 제목과 내용 추출 (간단한 규칙 사용)
        $sentences = array_map(function($s) { return $s['text']; }, $namedEntities['sentence']);
        $extractedInfo["title"] = $sentences[0] ?? "";
        $extractedInfo["content"] = implode(" ", array_slice($sentences, 1));

        return $extractedInfo;
    } else {
        return ["error" => "Failed to analyze text"];
    }
}

// 사용 예시
$text = "내일 오후 2시에 서울 강남구 테헤란로에 있는 코엑스에서 AI 컨퍼런스가 열립니다. SK텔레콤과 삼성전자가 주최하는 이번 행사는 많은 관심을 받고 있습니다.";
$result = analyzeText($text);
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>