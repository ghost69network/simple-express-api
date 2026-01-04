const express = require("express");
const router = express.Router();
const userModel = require("../data/users");

const generateToken = (userId) => {
    return `fake-jwt-token-${userId}-${Date.now()}`;
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Token required",
        });
    }

    const user = userModel.verifyToken(token);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Invalid token",
        });
    }

    req.user = user;
    next();
};

router.post("/register", (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required",
        });
    }

    const existingUser = userModel.findByEmail(email);
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "User already exists",
        });
    }

    const newUser = userModel.create({ username, email, password });
    const token = generateToken(newUser.id);
    userModel.saveToken(newUser.id, token);

    res.status(201).json({
        success: true,
        token,
        user: newUser,
    });
});

router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password required",
        });
    }

    const user = userModel.findByEmail(email);
    if (!user || !userModel.checkPassword(user, password)) {
        return res.status(401).json({
            success: false,
            message: "Invalid credentials",
        });
    }

    const token = generateToken(user.id);
    userModel.saveToken(user.id, token);

    const { password: _, ...userWithoutPassword } = user;

    res.json({
        success: true,
        token,
        user: userWithoutPassword,
    });
});

router.get("/profile", authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user,
    });
});

router.get("/users", authenticateToken, (req, res) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Access denied",
        });
    }

    const users = userModel.getAll();
    res.json({
        success: true,
        count: users.length,
        users,
    });
});

module.exports = router;
