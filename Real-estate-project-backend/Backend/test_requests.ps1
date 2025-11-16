# Test script to check backend endpoints
Write-Host '----HEALTH----'
try {
    $h = Invoke-RestMethod http://127.0.0.1:8000/health
    $h | ConvertTo-Json -Depth 5 | Write-Host
} catch {
    Write-Host 'HEALTH_FAIL:' $_.Exception.Message
}

Write-Host '----COLUMNS----'
try {
    $c = Invoke-RestMethod http://127.0.0.1:8000/columns
    $c | ConvertTo-Json -Depth 5 | Write-Host
} catch {
    Write-Host 'COLUMNS_FAIL:' $_.Exception.Message
}

Write-Host '----PREDICT----'
$body = @{ features_by_name = @{ Id=1; LotArea=2000; BedroomAbvGr=3; FullBath=2; OverallQual=5; YearBuilt=2010; GrLivArea=2000; TotRmsAbvGrd=7; HalfBath=0; GarageCars=1; GarageArea=200; YearRemodAdd=2010; KitchenAbvGr=1; Fireplaces=0; MoSold=6; YrSold=2024 } }
try {
    $json = $body | ConvertTo-Json -Depth 5
    $p = Invoke-RestMethod -Uri http://127.0.0.1:8000/predict -Method Post -Body $json -ContentType 'application/json'
    $p | ConvertTo-Json -Depth 5 | Write-Host
} catch {
    Write-Host 'PREDICT_FAIL:' $_.Exception.Message
}
