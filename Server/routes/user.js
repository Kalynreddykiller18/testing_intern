const router = require("express").Router();
const bcrypt = require("bcrypt");
const mongo = require("mongodb");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const { exists, emit } = require("../models/user");
const User = require("../models/user");

const url = process.env.MONGO_URL;

// Get single user
router.get("/:id", async (req, res) => {
    try {
        const userge = await User.findById(req.params.id);
        res.json(userge);
    } catch (err) {
        console.log(err);
    }
});

// Get all Users
router.get("/", async (req, res) => {
    try {
        const user = await User.find();
        res.json(user);
    } catch (err) {
        res.status(400).send(err);
    }
});

// Signup a User
router.post("/add", async (req, res) => {
    try {
        var usrexist = false;
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);

        const newUser = new User({
            fullname: req.body.fullname,
            email: req.body.email,
            password: hashedPassword,
            resetPasswordToken: "",
            resetPasswordExpires: null,
        });

        await User.findOne({ email: newUser.email }, (err, result) => {
            if (result == null) {
                usrexist = false;
            } else {
                usrexist = true;
                res.json({
                    message: "Account with this mail already exists",
                    status: false,
                });
                res.end();
            }
        });

        if (!usrexist) {
            await newUser.save();
            res.json({ message: "User Signed up Succefully", status: true });
            res.end();
        }
    } catch (err) {
        console.log(err.message);
        res.json({ error: err });
        res.end();
    }
});

// Update a User
router.route("/update/:id").post((req, res) => {
    User.findById(req.params.id)
        .then((result) => {
            result.fullname = req.body.fullname;
            result.email = req.body.email;

            result
                .save()
                .then(() => {
                    res.json("User Updated");
                })
                .catch((err) => res.sendStatus(201));
        })
        .catch((err) => res.status(404).json("Failed"));
});

// // Login a User
// creating module for logging route
// Login Module
const login_email = (email, password, callBack) => {
    try {
        // exists = false;
        mongo.connect(
            url,
            { useNewUrlParser: true, useUnifiedTopology: true },
            (err, db) => {
                db.db()
                    .collection("users")
                    .findOne({ email: email }, (err, result) => {
                        if (err) {
                            callBack(null, false, "account does not exist");
                        } else if (result) {
                            bcrypt.compare(
                                password,
                                result.password,
                                (err, logBool) => {
                                    if (!logBool) {
                                        return callBack(
                                            null,
                                            false,
                                            "Invalid Credentials"
                                        );
                                    }
                                    callBack(
                                        result,
                                        true,
                                        "Your Successfull Loged In"
                                    );
                                }
                            );
                        } else {
                            callBack(null, false, "Account does not exist");
                        }
                        db.close();
                    });
            }
        );
    } catch (e) {
        callBack(null, true, e);
    }
};

router.post("/login", async (req, res) => {
    try {
        if (
            req.body.hasOwnProperty("email") &&
            req.body.hasOwnProperty("password")
        ) {
            login_email(
                req.body.email,
                req.body.password,
                (result, exists, message) => {
                    // if (exists) {
                    res.json({
                        status: exists,
                        message: message,
                        result: result,
                    });
                    // } else {
                    //     console.log("2");
                    //     res.json({ status: false, message: message });
                    // }
                }
            );
        } else {
            if (!req.body.hasOwnProperty("email")) {
                res.json({ status: false, message: "Please enter E-Mail" });
            } else if (!req.body.hasOwnProperty("password")) {
                res.json({ status: false, message: "Please enter Password" });
            }
        }
    } catch (err) {
        console.log("Error occured" + err);
        res.json({ status: false, message: "Failed at try block...!" });
    }
});

// // Forgott password
// // Forgot-Password

let mailTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "praveen123kalyan@gmail.com",
        pass: "Mkmkam12",
    },
});

//Getting Forgott Mail
router.post("/forgot-password", async (req, res) => {
    try {
        const token = require("crypto").randomBytes(20).toString("hex");

        await User.findOne({ email: req.body.email }, (err, result) => {
            if (result) {
                result.resetPasswordToken = token;
                result.resetPasswordExpires = Date.now() + 1800000;

                result.save().then(async () => {
                    await mailTransporter.sendMail(
                        {
                            from: "praveen123kalyan@gmail.com",
                            to: req.body.email,
                            subject: "Test Mail",
                            text:
                                "This is your forgott setting options !Thank you for being patient" +
                                "Please vist the below link to Rest yout Password \n" +
                                // `http://${req.headers.host}/user/reset/${token}\n\n`,
                                `http://localhost:3000/user/reset/${token}`,
                        },
                        (err, data) => {
                            if (err) {
                                console.log(`Error is occured${err}`);
                            } else {
                                res.json({
                                    status: true,
                                    message: "Forgot mail sent successfully!",
                                    data: data,
                                });
                            }
                        }
                    );
                });
            } else {
                res.json({ status: false, message: "Account Does not exist" });
            }
        });

        // await mailTransporter.sendMail(
        //     {
        //         from: "praveen123kalyan@gmail.com",
        //         to: req.body.email,
        //         subject: "Test Mail",
        //         text:
        //             "This is your forgott setting options !Thank you for being patient" +
        //             "Please vist the below link to Rest yout Password \n" +
        //             `http://${req.headers.host}/user/reset/${token}\n\n`,
        //     },
        //     (err, data) => {
        //         if (err) {
        //             console.log(`Error is occured${errt}`);
        //         } else {
        //             res.json({
        //                 status: true,
        //                 message: "Forgot mail sent successfully!",
        //                 data: data,
        //             });
        //         }
        //     }
        // );
    } catch (err) {
        console.log(`Error occure ${err}`);
    }
});

// Check-fogott-password
router.get("/reset/:token", (req, res) => {
    User.findOne(
        {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
        },
        (err, result) => {
            if (!result) {
                return res.json({
                    status: false,
                    message: "Password reset token is inavlid or expired",
                });
            }
            res.json({ status: true, message: "Forgott Password Successfull" });
        }
    );
});

// SetForgott Password
router.post("/setnewpassword/:resetPasswordToken", async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        User.findOne(
            { resetPasswordToken: req.params.resetPasswordToken },
            (err, result) => {
                if (!result) {
                    return req.json({
                        message: "Password reset token is inavlid or expired",
                    });
                }

                result.password = hashedPassword;

                result
                    .save()
                    .then(() =>
                        res.json({ message: "New Password Updated Succefully" })
                    )
                    .catch((err) =>
                        res
                            .sendStatus(203)
                            .json({ message: "Fsiled to update New Password" })
                    );
            }
        );
    } catch (err) {
        res.json({ message: "Failed at try block" + err });
    }
});

// Delete a User
router.delete("/delete/:id", async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id)
            .then(() => res.json("User Delted Successfully"))
            .catch((err) => console.log(err));
    } catch (err) {
        console.log(err);
    }
});

module.exports = router;
