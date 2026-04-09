import * as yup from "yup";

// Animal validation schema
export const animalSchema = yup.object().shape({
  name: yup
    .string()
    .required("Animal name is required")
    .min(2, "Name must be at least 2 characters"),
  animal_type: yup.string().required("Animal type is required"),
  breed: yup.string().optional(),
  birth_date: yup
    .date()
    .max(new Date(), "Birth date cannot be in the future")
    .nullable()
    .optional(),
  gender: yup.string().required("Gender is required"),
  weight: yup
    .number()
    .positive("Weight must be greater than 0")
    .nullable()
    .optional(),
  status: yup.string().required("Status is required"),
  is_group: yup.boolean().optional(),
  count: yup
    .number()
    .when("is_group", {
      is: true,
      then: (schema) =>
        schema
          .required("Count is required for groups")
          .min(2, "Group must have at least 2 animals"),
      otherwise: (schema) => schema.optional(),
    }),
  avg_weight: yup.number().nullable().optional(),
  notes: yup.string().optional(),
});

// Crop validation schema
export const cropSchema = yup.object().shape({
  name: yup
    .string()
    .required("Crop name is required")
    .min(2, "Name must be at least 2 characters"),
  field: yup.string().required("Field name is required"),
  area: yup
    .number()
    .required("Area is required")
    .positive("Area must be greater than 0"),
  planted_date: yup
    .date()
    .required("Planted date is required")
    .max(new Date(), "Planted date cannot be in the future"),
  expected_harvest_date: yup
    .date()
    .required("Expected harvest date is required")
    .min(
      yup.ref("planted_date"),
      "Harvest date must be after planted date"
    ),
  actual_harvest_date: yup
    .date()
    .min(
      yup.ref("planted_date"),
      "Actual harvest date must be after planted date"
    )
    .max(new Date(), "Harvest date cannot be in the future")
    .nullable()
    .optional(),
  variety: yup.string().optional(),
  status: yup.string().required("Status is required"),
  stage: yup.string().required("Stage is required"),
  notes: yup.string().optional(),
});

// Task validation schema
export const taskSchema = yup.object().shape({
  title: yup
    .string()
    .required("Task title is required")
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title cannot exceed 200 characters"),
  description: yup
    .string()
    .required("Description is required")
    .min(10, "Description must be at least 10 characters"),
  due_date: yup.date().required("Due date is required"),
  priority: yup.string().required("Priority is required"),
  status: yup.string().required("Status is required"),
  category: yup.string().required("Category is required"),
  assigned_to: yup.string().nullable().optional(),
  notes: yup.string().optional(),
});

// Expense validation schema
export const expenseSchema = yup.object().shape({
  date: yup
    .date()
    .required("Expense date is required")
    .max(new Date(), "Date cannot be in the future"),
  category: yup.string().required("Category is required"),
  description: yup
    .string()
    .required("Description is required")
    .min(5, "Description must be at least 5 characters"),
  amount: yup
    .number()
    .required("Amount is required")
    .positive("Amount must be greater than 0"),
  vendor: yup
    .string()
    .required("Vendor is required")
    .min(2, "Vendor name must be at least 2 characters"),
  payment_method: yup.string().required("Payment method is required"),
  notes: yup.string().optional(),
});

// Inventory item validation schema
export const inventorySchema = yup.object().shape({
  name: yup
    .string()
    .required("Item name is required")
    .min(2, "Name must be at least 2 characters"),
  category: yup.string().required("Category is required"),
  quantity: yup
    .number()
    .required("Quantity is required")
    .min(0, "Quantity cannot be negative"),
  unit: yup.string().required("Unit is required"),
  min_quantity: yup
    .number()
    .required("Minimum quantity is required")
    .min(0, "Minimum cannot be negative"),
  cost_per_unit: yup
    .number()
    .min(0, "Cost cannot be negative")
    .nullable()
    .optional(),
  location: yup.string().optional(),
  purchase_date: yup.date().nullable().optional(),
  expiry_date: yup
    .date()
    .min(
      yup.ref("purchase_date"),
      "Expiry date must be after purchase date"
    )
    .nullable()
    .optional(),
});

// Inventory transaction schema
export const inventoryTransactionSchema = yup.object().shape({
  quantity: yup
    .number()
    .required("Quantity is required")
    .positive("Quantity must be greater than 0"),
  type: yup.string().required("Transaction type is required"),
  notes: yup.string().optional(),
});

// Registration schema
export const registrationSchema = yup.object().shape({
  first_name: yup
    .string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters"),
  last_name: yup
    .string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  username: yup
    .string()
    .required("Username is required")
    .min(3, "Username must be at least 3 characters")
    .matches(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  email: yup
    .string()
    .required("Email is required")
    .email("Must be a valid email"),
  phone: yup.string().optional(),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /[A-Z]/,
      "Password must contain at least one uppercase letter"
    )
    .matches(
      /[a-z]/,
      "Password must contain at least one lowercase letter"
    )
    .matches(/[0-9]/, "Password must contain at least one number"),
  confirm_password: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password")], "Passwords must match"),
  farm_name: yup
    .string()
    .required("Farm name is required")
    .min(2, "Farm name must be at least 2 characters"),
  farm_type: yup.string().optional(),
  farm_size: yup.string().optional(),
  farm_location: yup.string().optional(),
});

// Login schema
export const loginSchema = yup.object().shape({
  username: yup
    .string()
    .required("Username is required"),
  password: yup
    .string()
    .required("Password is required"),
});

// Profile schema
export const profileSchema = yup.object().shape({
  first_name: yup
    .string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters"),
  last_name: yup
    .string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  email: yup
    .string()
    .required("Email is required")
    .email("Must be a valid email"),
  phone: yup.string().optional(),
});

// Password change schema
export const passwordChangeSchema = yup.object().shape({
  current_password: yup
    .string()
    .required("Current password is required"),
  new_password: yup
    .string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /[A-Z]/,
      "Password must contain at least one uppercase letter"
    )
    .matches(
      /[a-z]/,
      "Password must contain at least one lowercase letter"
    )
    .matches(/[0-9]/, "Password must contain at least one number"),
  confirm_password: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("new_password")], "Passwords must match"),
});

// Farm schema
export const farmSchema = yup.object().shape({
  name: yup
    .string()
    .required("Farm name is required")
    .min(2, "Name must be at least 2 characters"),
  farm_type: yup.string().required("Farm type is required"),
  size: yup.string().required("Farm size is required"),
  location: yup
    .string()
    .required("Location is required")
    .min(2, "Location must be at least 2 characters"),
  address: yup.string().optional(),
  total_area: yup
    .number()
    .required("Total area is required")
    .positive("Area must be greater than 0"),
  description: yup.string().optional(),
});
