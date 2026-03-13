module.exports = {
    apps: [
        {
            name: "peixaria-ono",
            script: "npm",
            args: "start",
            env: {
                NODE_ENV: "production",
                PORT: 3005, // Usaremos a porta 3005 para não dar conflito com sua outra aplicação
                DATABASE_URL: "file:./dev.db"
            }
        }
    ]
};
