import mongoose from "mongoose";


const EductionSchema = {
    highSchool: {
        type: String
    },
    intermediate: {
        type: String
    },
    graduation: {
        type: String,
    },
    postgraduation: {
        type: String
    },
    additional: {
        type: String
    }

}

const AddressSchema = {
    state: {
        trim: true,
        type: String
    },

    city: {
        type: String,
        trim: true
    },
    pincode: {
        type: String,
        trim: true
    },
    completeAddress: {
        type: String,
        trim: true
    },


}

const socialSchema = {
    linkedin: {
        type: String,
        trim: true
    },
    instagram: {
        type: String,
        trim: true
    },
    facebook: {
        type: String,
        trim: true
    }

}

const bankSchema = {
    adharcard: {
        type: String
    },
    pancard: {
        type: String
    },
    bankName: {
        type: String
    },
    ifsccode: {
        type: String
    }
    ,
    accountHolder: {
        type: String,
    },
    accoundNumber: {
        type: String
    }

}

const TherepistSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true
        },
        mobile: {
            type: String,
            required: true,
            trim: true
        },
        gender: {
            type: String,
            required: true,
            trim: true

        },
        education: EductionSchema,
        licence: {
            type: String,
            trim: true,

        },
        specailization: {
            type: [String],
            required: true,
            trim: true

        },
        experience: {
            type: String,
            required: false,
            trim: true
        },
        passport: {
            type: String,
            required: false
        },
        bio: {
            type: String,
            trim: true
        },
        address: AddressSchema,
        language: {
            type: [String],
            trim: true

        },
        social: socialSchema
        ,
        bankdetail: bankSchema



    }

    , { timestamps: true });


export const TherepisetModel = mongoose.model('therepists', TherepistSchema);
