const doTest = async () => {
    try {
        const res = await fetch('http://localhost:3000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'testuser', email: 'test1@example.com', password: 'Password123!' })
        });
        const text = await res.text();
        require('fs').writeFileSync('output.json', text);
    } catch (err) {
        console.error(err);
    }
};

doTest();
