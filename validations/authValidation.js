import yup from "yup"
export const userSchema = yup.object({
  username: yup
    .string()
    .trim()
    .min(5, "name must be atleast 5 characters")
    .required(),

  email: yup
    .string()
    .email()
    .required(),

  password: yup
    .string()
    .min(6, "password must be atleast 6 characters")
    .required()
});
export const validateUser = (schema) => async (req, res ,next) => {
    try {
        await schema.validate(req.body)
        next()
    } catch (error) {
        return res.status(400).send({message : error.message})
        
    }
}