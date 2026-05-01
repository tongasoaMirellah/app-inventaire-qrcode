import bcrypt from "bcrypt";

const run = async () => {
    const password = "password123";
    const hash = await bcrypt.hash(password, 10);
    console.log("Voici ton hash :");
    console.log(hash);
};

run();
