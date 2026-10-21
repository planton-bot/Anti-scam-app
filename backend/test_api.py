# ============================================
# test_api.py - Test API Lacak IPWho
# ============================================

import requests
import json
import time

# Base URL API
BASE_URL = 'http://localhost:5000'

def print_header(text):
    print('\n' + '═' * 60)
    print(f'  {text}')
    print('═' * 60)

def test_health():
    """Test endpoint health"""
    print_header('🏥 HEALTH CHECK')
    try:
        response = requests.get(f'{BASE_URL}/api/health', timeout=5)
        print(f'Status: {response.status_code}')
        print(json.dumps(response.json(), indent=2))
        return True
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

def test_lacak_ip(ip):
    """Test lacak single IP"""
    print_header(f'📍 LACAK IP: {ip}')
    try:
        response = requests.get(f'{BASE_URL}/api/lacak', params={'ip': ip}, timeout=10)
        data = response.json()
        
        if data.get('success'):
            info = data['data']
            print(f"🌍 {info['flag_emoji']} {info['country']} ({info['country_code']})")
            print(f"📍 {info['city']}, {info['region']}")
            print(f"🗺️  Lat: {info['latitude']}, Lon: {info['longitude']}")
            print(f"🏷️  ISP: {info['isp']}")
            print(f"⏰ Timezone: {info['timezone']}")
            print(f"💰 Mata Uang: {info['currency']}")
            print(f"\n🔒 Keamanan:")
            print(f"   VPN: {'⚠️ YA' if info['is_vpn'] else '✅ TIDAK'}")
            print(f"   Proxy: {'⚠️ YA' if info['is_proxy'] else '✅ TIDAK'}")
            print(f"   Tor: {'⚠️ YA' if info['is_tor'] else '✅ TIDAK'}")
            print(f"   Hosting: {'⚠️ YA' if info['is_hosting'] else '✅ TIDAK'}")
            print(f"   Threat Score: {info['threat_score']}/10")
            return True
        else:
            print(f'❌ Gagal: {data.get("message")}')
            return False
            
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

def test_lacak_bulk(ips):
    """Test lacak multiple IP"""
    print_header(f'📦 LACAK BULK ({len(ips)} IP)')
    try:
        response = requests.post(
            f'{BASE_URL}/api/lacak-bulk',
            json={'ips': ips},
            timeout=30
        )
        data = response.json()
        
        if data.get('success'):
            print(f"✅ Berhasil: {data['total']} IP dilacak")
            for i, result in enumerate(data['results']):
                if result.get('success'):
                    info = result['data']
                    print(f"  {i+1}. {info['ip']} - {info['flag_emoji']} {info['city']}, {info['country']}")
                else:
                    print(f"  {i+1}. ❌ {result.get('message')}")
            return True
        else:
            print(f'❌ Gagal: {data.get("message")}')
            return False
            
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

# ============================================
# MAIN TEST
# ============================================
if __name__ == '__main__':
    print('🧪 TEST API LACAK IPWHO')
    print('═' * 60)
    
    # Test 1: Health Check
    if not test_health():
        print('\n❌ Server tidak berjalan! Jalankan python api_lacak.py')
        exit(1)
    
    # Test 2: Single IP
    test_lacak_ip('8.8.8.8')
    time.sleep(0.5)
    test_lacak_ip('1.1.1.1')
    time.sleep(0.5)
    test_lacak_ip('185.169.0.125')
    
    # Test 3: Bulk
    test_lacak_bulk(['8.8.8.8', '1.1.1.1', '185.169.0.125'])
    
    print('\n✅ Semua test selesai!')