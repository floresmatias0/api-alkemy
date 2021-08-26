require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const bcrypt = require('bcrypt');
const path = require('path');

const sequelize = new Sequelize(`${process.env.DATABASE_URL}?sslmode=require`, {
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
  logging: false,
  native: false,
  dialectOptions: {
    ssl: {
      rejectUnauthorized: false, // very important
    }
  }
});

const basename = path.basename(__filename);

const modelDefiners = [];

// Leemos todos los archivos de la carpeta Models, los requerimos y agregamos al arreglo modelDefiners
fs.readdirSync(path.join(__dirname, '/models'))
  .filter((file) => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
  .forEach((file) => {
    modelDefiners.push(require(path.join(__dirname, '/models', file)));
  });

// Injectamos la conexion (sequelize) a todos los modelos
modelDefiners.forEach(model => model(sequelize));
// Capitalizamos los nombres de los modelos ie: product => Product
let entries = Object.entries(sequelize.models);
let capsEntries = entries.map((entry) => [entry[0][0].toUpperCase() + entry[0].slice(1), entry[1]]);
sequelize.models = Object.fromEntries(capsEntries);

// En sequelize.models están todos los modelos importados como propiedades
// Para relacionarlos hacemos un destructuring
const { User, Operation } = sequelize.models;

// Aca vendrian las relaciones:
User.belongsToMany(Operation, { through: 'Users_Operation', as: 'operations' });
Operation.belongsToMany(User, { through: 'Users_Operation', as: 'users' });

//Antes de crear un usuario se hashea la contraseña con el password virual
User.beforeCreate(async (user) => {
  if (user.password_virtual) {
    const encryptPassword = await bcrypt.hash(user.password_virtual, 10);
    user.password = encryptPassword;
  }
});


module.exports = {
  ...sequelize.models, // para poder importar los modelos así: const { User } = require('./db.js');
  conn: sequelize,     // para importart la conexión { conn } = require('./db.js');
};
