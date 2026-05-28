import tbl_contact from "../models/ContactModel.js";
import { StatusCodes } from "http-status-codes";

export const getAllContacts = async (req, res) => {
  try {
    const contacts = await tbl_contact.find({}).sort("-createdAt");
    res.status(StatusCodes.OK).json({ contacts });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const createContact = async (req, res) => {
  try {
    const contact = await tbl_contact.create(req.body);
    res.status(StatusCodes.CREATED).json({ msg: "Contact form submitted", contact });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    await tbl_contact.findByIdAndDelete(id);
    res.status(StatusCodes.OK).json({ msg: "Contact deleted" });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
  }
};
