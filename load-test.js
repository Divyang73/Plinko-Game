import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100, // 100 concurrent users
  duration: '10s', // run for 10 seconds
};

let token = '';

export function setup() {
  // Register a dummy user to run simulations
  const username = `load_${Math.random().toString(36).substring(2, 10)}`;
  const password = 'password123';
  
  const res = http.post('http://localhost:3000/api/auth/register', JSON.stringify({
    username: username,
    password: password
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (res.status === 200) {
    return { token: res.json().token };
  } else {
    console.error(`Failed to register user: ${res.body}`);
    return { token: '' };
  }
}

export default function (data) {
  if (!data.token) return;

  const payload = JSON.stringify({
    cost: 1,
    risk: 'low',
    rows: 8
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${data.token}`
    },
  };

  const res = http.post('http://localhost:3000/api/simulate', payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  // Wait slightly to simulate a real user spamming, 
  // but keep it fast enough to push the RPS
  sleep(0.1); 
}
