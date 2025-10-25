const { Employee, EmployeeSalary } = require('../models');
const { Op } = require('sequelize');

// Get employees with pagination and search functionality
const getEmployeesWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const offset = page * size;

    // Search parameters
    const { search, status } = req.query;
    let whereClause = {};

    // Build search conditions
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { designation: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Employee.findAndCountAll({
      where: whereClause,
      limit: size,
      offset: offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      content: rows,
      totalElements: count,
      totalPages: Math.ceil(count / size),
      size: size,
      number: page
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all employees (for dropdowns)
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      where: { status: 'active' },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'designation', 'basic_salary']
    });

    res.json(employees);
  } catch (error) {
    console.error('Error fetching all employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new employee
const createEmployee = async (req, res) => {
  try {
    const { name, designation, joining_date, status, basic_salary } = req.body;

    const employee = await Employee.create({
      name,
      designation,
      joining_date,
      status: status || 'active',
      basic_salary
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, designation, joining_date, status, basic_salary } = req.body;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await employee.update({
      name,
      designation,
      joining_date,
      status,
      basic_salary
    });

    res.json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await employee.destroy();
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getEmployeesWithPagination,
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
};
