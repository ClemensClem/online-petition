DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS signatures CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;


CREATE TABLE users(
      id SERIAL PRIMARY KEY,
      first VARCHAR(255) NOT NULL,
      last VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );


CREATE TABLE signatures(
      id SERIAL PRIMARY KEY,
      signature TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );


CREATE TABLE user_profiles(
      id SERIAL PRIMARY KEY,
      age INT NULL,
      city VARCHAR(255),
      homepage VARCHAR(255),
      user_id INT NOT NULL UNIQUE REFERENCES users(id), 
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

