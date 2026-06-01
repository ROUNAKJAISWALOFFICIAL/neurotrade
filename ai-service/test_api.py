#!/usr/bin/env python3
"""
Test script for TradeEdge AI Service
Tests signal generation with real data and Gemini API integration
"""

import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000"
TEST_INSTRUMENTS = [
    "NSE_EQ|INE002A01018",  # TCS
    "NSE_EQ|INE040A01034",  # HDFC Bank
    "NSE_EQ|INE600B01024",  # RELIANCE
    "NSE_EQ|INE467B01029",  # INFY
]

def test_health():
    """Test health endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"ERROR: {e}")
        return False

def test_signal(instrument_key):
    """Test signal generation for a single instrument"""
    print("\n" + "="*60)
    print(f"TEST: Signal for {instrument_key}")
    print("="*60)
    try:
        response = requests.get(
            f"{BASE_URL}/signal/{instrument_key}",
            timeout=15
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            signal = data.get("signal", {})
            
            print(f"\n✓ SUCCESS: Got signal for {instrument_key}")
            print(f"  Signal: {signal.get('signal')} (Confidence: {signal.get('confidence')}%)")
            print(f"  Reason: {signal.get('reason')}")
            print(f"  Price: {signal.get('price')}")
            print(f"  Target: {signal.get('target')}")
            print(f"  Stop Loss: {signal.get('stopLoss')}")
            
            indicators = signal.get('indicators', {})
            print(f"\n  Technical Indicators:")
            print(f"    - RSI: {indicators.get('rsi'):.2f}")
            print(f"    - MACD: {indicators.get('macd'):.4f}")
            print(f"    - MACD Signal: {indicators.get('macd_signal'):.4f}")
            print(f"    - Trend: {indicators.get('trend')}")
            
            print(f"\n  Decision Making:")
            print(f"    - Rule-based signal: {signal.get('rule_signal')}")
            print(f"    - Gemini AI signal: {signal.get('gemini_signal')}")
            
            return True
        else:
            print(f"✗ FAILED: Status {response.status_code}")
            print(f"  Error: {response.text}")
            return False
            
    except requests.Timeout:
        print(f"✗ TIMEOUT: Request took too long (>15s)")
        return False
    except Exception as e:
        print(f"✗ ERROR: {type(e).__name__}: {e}")
        return False

def test_analyze():
    """Test analyze endpoint"""
    print("\n" + "="*60)
    print("TEST: Analyze Endpoint")
    print("="*60)
    
    instrument = TEST_INSTRUMENTS[0]
    try:
        payload = {"instrument_key": instrument}
        response = requests.post(
            f"{BASE_URL}/analyze",
            json=payload,
            timeout=15
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ SUCCESS: Analyze endpoint working")
            return True
        else:
            print(f"✗ FAILED: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ ERROR: {e}")
        return False

def test_bulk_signals():
    """Test bulk signals endpoint"""
    print("\n" + "="*60)
    print("TEST: Bulk Signals Endpoint")
    print("="*60)
    
    try:
        response = requests.post(
            f"{BASE_URL}/bulk-signals",
            json=TEST_INSTRUMENTS[:2],
            timeout=30
        )
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            count = data.get('count', 0)
            print(f"✓ SUCCESS: Generated {count} signals")
            
            for sig in data.get('signals', [])[:2]:
                print(f"  - {sig.get('instrument_key')}: {sig.get('signal')} ({sig.get('confidence')}%)")
            
            return True
        else:
            print(f"✗ FAILED: {response.text}")
            return False
            
    except Exception as e:
        print(f"✗ ERROR: {e}")
        return False

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*70)
    print(" TRADEEDGE AI SERVICE - INTEGRATION TESTS")
    print("="*70)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Instruments: {len(TEST_INSTRUMENTS)}")
    
    results = {}
    
    # Test health
    results['health'] = test_health()
    
    if not results['health']:
        print("\n✗ CRITICAL: Cannot connect to API. Make sure the server is running:")
        print("  cd ai-service && python -m uvicorn main:app --reload")
        return
    
    # Test individual signals
    print("\n" + "="*70)
    print(" TESTING SIGNAL GENERATION")
    print("="*70)
    for instrument in TEST_INSTRUMENTS:
        results[f"signal_{instrument}"] = test_signal(instrument)
    
    # Test analyze endpoint
    results['analyze'] = test_analyze()
    
    # Test bulk signals
    results['bulk'] = test_bulk_signals()
    
    # Summary
    print("\n" + "="*70)
    print(" TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All tests passed! API is working correctly.")
    else:
        print(f"\n✗ {total - passed} test(s) failed. Check the logs above.")

if __name__ == "__main__":
    # Check environment
    if not os.getenv("UPSTOX_ACCESS_TOKEN"):
        print("✗ CRITICAL: UPSTOX_ACCESS_TOKEN not set in .env file")
        exit(1)
    
    if not os.getenv("GEMINI_API_KEY"):
        print("⚠ WARNING: GEMINI_API_KEY not set. Using rule-based signals only.")
    
    run_all_tests()
