// src/components/Login.tsx
function Login() {
  // ... existing code ...

  return (
    <div className="login-container" style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>Login to Cricket Tournament Platform</h2>
      
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="login-email" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Email Address
          </label>
          <input
            type="email"
            id="login-email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            autoComplete="email"
            aria-describedby={error ? "login-error" : undefined}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="login-password" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Password
          </label>
          <input
            type="password"
            id="login-password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
            aria-describedby={error ? "login-error" : undefined}
            style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-describedby={loading ? "login-loading" : undefined}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}