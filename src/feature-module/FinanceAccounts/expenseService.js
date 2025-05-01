import axios from 'axios';

const API_BASE_URL = '/api/expense';

// Fetch all expenses
export const fetchExpenses = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

// Fetch a single expense by ID
export const fetchExpenseById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching expense by ID:', error);
    throw error;
  }
};

// Create a new expense
export const createExpense = async (expenseData) => {
  try {
    const response = await axios.post(API_BASE_URL, expenseData);
    return response.data;
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

// Update an existing expense
export const updateExpense = async (id, expenseData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${id}`, expenseData);
    return response.data;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

// Delete an expense
export const deleteExpense = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};