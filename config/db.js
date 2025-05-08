// const { Sequelize } = require("sequelize");
// require("dotenv").config(); // Load environment variables from .env file


// const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
//     host: process.env.DB_HOST,
//     dialect: "mysql",
//     logging: false, // Disable logging for cleaner output
// });


// const connection = async () => {
//     try {
//         await db.authenticate();
//         console.log("✅ Database connected successfully.");
//     } catch (err) {
//         console.error("❌ Unable to connect to the database:", err);
//     }
// };

// // Call connection function
// connection();

// module.exports = db;

    const { Sequelize } = require("sequelize");
    require("dotenv").config(); // Load environment variables from .env file
    console.log("Database name",process.env.DB_NAME);
    console.log("Database user",process.env.DB_USER);
    console.log("Database password",process.env.DB_PASS);
    console.log("Database host",process.env.DB_HOST);
    console.log("Database port",process.env.DB_PORT);
    console.log("Database env",process.env);
    console.log("Database url",process.env.DATABASE_URL);
    const db = new Sequelize(process.env.DATABASE_URL, {
        dialect: "mysql",
        logging: false,
        dialectOptions: {
            ssl: false, // Railway MySQL typically doesn't use SSL
        },
    });

    const connection = async () => {
        try {
            await db.authenticate();
            console.log("✅ Database connected successfully.");
        } catch (err) {
            console.error("❌ Unable to connect to the database:", err);
        }
    };

    // Call connection function
    connection();

    module.exports = db;
