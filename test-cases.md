# Rate Calculator Test Cases

## Test Scenarios (Based on New Rates)

### Highsec Tests

**Test 1: BR Highsec (Small Package)**

- Volume: 10,000 m³
- Jumps: 10
- Collateral: 500M ISK
- Expected: 3M + (10 \* 800k) = **11M ISK**

**Test 2: DST Highsec (Medium Package)**

- Volume: 50,000 m³
- Jumps: 10
- Collateral: 500M ISK
- Expected: 8M + (10 \* 1.2M) = **20M ISK**

**Test 3: Freighter Highsec (Large Package)**

- Volume: 500,000 m³
- Jumps: 10
- Collateral: 1B ISK
- Expected: 15M + (10 \* 1.8M) = **33M ISK**

**Test 4: DST Highsec with Collateral (1-3B tier)**

- Volume: 50,000 m³
- Jumps: 10
- Collateral: 2B ISK
- Expected: 20M + (2B \* 0.3%) = 20M + 6M = **26M ISK**

**Test 5: DST Highsec with Collateral (3-5B tier)**

- Volume: 50,000 m³
- Jumps: 10
- Collateral: 4B ISK
- Expected: 20M + (4B \* 0.5%) = 20M + 20M = **40M ISK**

### Low/Null Tests

**Test 6: BR Lowsec**

- Volume: 10,000 m³
- Jumps: 10
- Collateral: 500M ISK
- Dangerous: ✓
- Expected: 10M + (10 \* 2M) = **30M ISK**

**Test 7: DST Lowsec (Our Competitive Advantage)**

- Volume: 50,000 m³
- Jumps: 10
- Collateral: 2B ISK
- Dangerous: ✓
- Expected: 20M + (10 _ 5M) + (2B _ 0.3%) = 20M + 50M + 6M = **76M ISK**
- Compare to PushX: Would force JF at ~1.2B ISK

**Test 8: JF (CORRECTED PRICING)**

- Volume: 200,000 m³
- Jumps: 10
- Collateral: 2B ISK
- Dangerous: ✓
- Expected: 150M + (10 _ 35M) + (2B _ 0.3%) = 150M + 350M + 6M = **506M ISK**
- OLD PRICE: 75M + (10 \* 60M) = 675M ISK ❌
- Compare to PushX: 200M + (10 \* 100M) = 1.2B ISK
- Compare to Black Frog: ~300-400M ISK (we're competitive)

### Collateral Cap Test

**Test 9: Over 5B Collateral**

- Volume: 50,000 m³
- Jumps: 10
- Collateral: 6B ISK
- Expected: **"Risako Hirano"**

## Competitive Comparison

| Scenario      | Vagrant (New) | PushX     | Advantage            |
| :------------ | :------------ | :-------- | :------------------- |
| BR HS 10J     | 11M           | 16.5M     | -33% cheaper         |
| DST HS 10J    | 20M           | 16.5M     | +21% (more capacity) |
| DST LS 10J 2B | 76M           | 1.2B (JF) | -94% cheaper         |
| JF 10J 2B     | 506M          | 1.2B      | -58% cheaper         |
