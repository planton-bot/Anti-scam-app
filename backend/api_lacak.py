# ============================================
# api_lacak.py - Backend Lacak dengan IPWho
# ============================================

import sys
import os
from datetime import datetime
import logging

# Tambahkan path backend ke sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import re
import json

# Import konfigurasi
from config import *

# ============================================
# SETUP LOGGING
# ============================================
os.makedirs('logs', exist_ok=True)

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# ============================================
# INIT FLASK APP
# ============================================
app = Flask(__name__)
CORS(app, origins=CORS_ORIGINS)

# ============================================
# FUNGSI CEK IP KE IPWHO
# ============================================
def cek_ip_who(ip):
    """Cek IP menggunakan IPWho API"""
    try:
        url = f"{IPWHO_URL}{ip}?apiKey={IPWHO_API_KEY}"
        logger.info(f"Memanggil IPWho: {ip}")
        
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"Berhasil mendapatkan data IP: {ip}")
            
            return {
                'success': True,
                'data': {
                    'ip': data.get('ip', ip),
                    'country': data.get('country', 'N/A'),
                    'country_code': data.get('country_code', 'N/A'),
                    'region': data.get('region', 'N/A'),
                    'city': data.get('city', 'N/A'),
                    'latitude': data.get('latitude', 0),
                    'longitude': data.get('longitude', 0),
                    'isp': data.get('isp', 'N/A'),
                    'timezone': data.get('timezone', 'N/A'),
                    'currency': data.get('currency', 'N/A'),
                    'flag_emoji': data.get('flag', {}).get('emoji', '🏳️'),
                    'is_vpn': data.get('security', {}).get('vpn', False),
                    'is_tor': data.get('security', {}).get('tor', False),
                    'is_proxy': data.get('security', {}).get('proxy', False),
                    'is_hosting': data.get('security', {}).get('hosting', False),
                    'threat_score': data.get('security', {}).get('threat_score', 0)
                }
            }
        else:
            logger.error(f"Error dari IPWho: {response.status_code} - {response.text}")
            return {
                'success': False,
                'message': f'Error {response.status_code}: {response.text}'
            }
            
    except requests.exceptions.Timeout:
        logger.error(f"Timeout untuk IP: {ip}")
        return {'success': False, 'message': '⏰ Timeout: Server IPWho tidak merespons'}
    except requests.exceptions.ConnectionError:
        logger.error(f"Connection error untuk IP: {ip}")
        return {'success': False, 'message': '❌ Gagal terhubung ke IPWho'}
    except Exception as e:
        logger.error(f"Error untuk IP {ip}: {str(e)}")
        return {'success': False, 'message': f'❌ Error: {str(e)}'}

def is_valid_ip(ip):
    """Validasi format IP"""
    pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
    return re.match(pattern, ip) is not None

# ============================================
# ENDPOINT: LACAK IP
# ============================================
@app.route('/api/lacak', methods=['GET'])
def lacak_ip():
    ip = request.args.get('ip')
    
    if not ip:
        logger.warning("Request tanpa parameter IP")
        return jsonify({
            'success': False,
            'message': 'Parameter "ip" wajib diisi'
        }), 400
    
    if not is_valid_ip(ip):
        logger.warning(f"IP tidak valid: {ip}")
        return jsonify({
            'success': False,
            'message': f'"{ip}" bukan IP yang valid'
        }), 400
    
    result = cek_ip_who(ip)
    return jsonify(result)

# ============================================
# ENDPOINT: LACAK BULK (Multiple IP)
# ============================================
@app.route('/api/lacak-bulk', methods=['POST'])
def lacak_bulk():
    data = request.get_json()
    ips = data.get('ips', []) if data else []
    
    if not ips:
        return jsonify({
            'success': False,
            'message': 'Parameter "ips" wajib diisi (array)'
        }), 400
    
    if len(ips) > 20:
        return jsonify({
            'success': False,
            'message': 'Maksimal 20 IP per request'
        }), 400
    
    results = []
    for ip in ips:
        if is_valid_ip(ip):
            result = cek_ip_who(ip)
            results.append(result)
        else:
            results.append({
                'success': False,
                'message': f'"{ip}" bukan IP yang valid'
            })
    
    return jsonify({
        'success': True,
        'total': len(results),
        'results': results
    })

# ============================================
# ENDPOINT: HEALTH CHECK
# ============================================
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'OK',
        'message': 'API Lacak IPWho berjalan',
        'api_key_used': IPWHO_API_KEY[:15] + '...' if IPWHO_API_KEY else 'TIDAK ADA',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# ============================================
# ENDPOINT: STATISTIK
# ============================================
@app.route('/api/stats', methods=['GET'])
def stats():
    # Ini contoh, nanti bisa diintegrasikan dengan database
    return jsonify({
        'total_requests': 0,
        'total_success': 0,
        'total_failed': 0,
        'uptime': '99.9%'
    })

# ============================================
# ERROR HANDLING
# ============================================
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Endpoint tidak ditemukan'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal Server Error: {str(error)}")
    return jsonify({'success': False, 'message': 'Terjadi kesalahan internal'}), 500

# ============================================
# JALANKAN SERVER
# ============================================
if __name__ == '__main__':
    print('🚀 API Lacak IPWho')
    print('═' * 50)
    print(f'🔑 API Key: {IPWHO_API_KEY[:15]}...')
    print(f'📡 Endpoint: http://{SERVER_HOST}:{SERVER_PORT}/api/lacak?ip=185.169.0.125')
    print(f'📁 Log file: {LOG_FILE}')
    print('═' * 50)
    print('📋 Daftar Endpoint:')
    print('  GET /api/lacak?ip={ip}')
    print('  POST /api/lacak-bulk (body: {"ips": ["ip1", "ip2"]})')
    print('  GET /api/health')
    print('  GET /api/stats')
    print('═' * 50)
    print('✅ Server berjalan di http://localhost:5000')
    
    app.run(debug=DEBUG_MODE, host=SERVER_HOST, port=SERVER_PORT)