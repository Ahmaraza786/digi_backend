const { Employee, EmployeeSalary } = require('../models');
const { Op } = require('sequelize');

// Get salaries with pagination and filters
const getSalariesWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const offset = page * size;

    // Filter parameters
    const { month, year, employee_id, is_finalized } = req.query;
    let whereClause = {};

    if (month) whereClause.month = month;
    if (year) whereClause.year = year;
    if (employee_id) whereClause.employee_id = employee_id;
    if (is_finalized !== undefined) whereClause.is_finalized = is_finalized === 'true';

    const { count, rows } = await EmployeeSalary.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name', 'designation']
        }
      ],
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
    console.error('Error fetching salaries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate salaries for a specific month/year
const generateSalaries = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    // Check if salaries already exist for this month/year
    const existingSalaries = await EmployeeSalary.findAll({
      where: { month, year }
    });

    if (existingSalaries.length > 0) {
      return res.status(400).json({ 
        error: `Salaries for ${month}/${year} already exist`,
        existingCount: existingSalaries.length
      });
    }

    // Get all active employees who were employed during the specified month/year
    const targetDate = new Date(year, month - 1, 1); // month is 1-based, Date constructor expects 0-based
    
    console.log(`Generating salaries for ${month}/${year}, target date: ${targetDate.toISOString()}`);
    
    const employees = await Employee.findAll({
      where: { 
        status: 'active',
        joining_date: {
          [Op.lte]: targetDate // Only include employees who joined on or before the target month
        }
      }
    });
    
    console.log(`Found ${employees.length} employees eligible for salary generation`);

    if (employees.length === 0) {
      return res.status(400).json({ error: 'No active employees found who were employed during this month/year' });
    }

    // Generate salary entries for each employee
    const salaryEntries = employees.map(employee => ({
      employee_id: employee.id,
      month,
      year,
      basic_salary: employee.basic_salary,
      bonus: 0,
      deductions: 0,
      net_salary: employee.basic_salary,
      is_finalized: false
    }));

    const createdSalaries = await EmployeeSalary.bulkCreate(salaryEntries);

    res.status(201).json({
      message: `Generated ${createdSalaries.length} salary entries for ${month}/${year}`,
      count: createdSalaries.length
    });
  } catch (error) {
    console.error('Error generating salaries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update salary entry
const updateSalary = async (req, res) => {
  try {
    const { id } = req.params;
    const { basic_salary, bonus, deductions } = req.body;

    const salary = await EmployeeSalary.findByPk(id);
    if (!salary) {
      return res.status(404).json({ error: 'Salary entry not found' });
    }

    if (salary.is_finalized) {
      return res.status(400).json({ error: 'Cannot update finalized salary' });
    }

    // Calculate net salary
    const netSalary = parseFloat(basic_salary) + parseFloat(bonus || 0) - parseFloat(deductions || 0);

    await salary.update({
      basic_salary,
      bonus: bonus || 0,
      deductions: deductions || 0,
      net_salary: netSalary
    });

    res.json(salary);
  } catch (error) {
    console.error('Error updating salary:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Finalize salaries for a month/year
const finalizeSalaries = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const salaries = await EmployeeSalary.findAll({
      where: { month, year, is_finalized: false }
    });

    if (salaries.length === 0) {
      return res.status(400).json({ error: 'No unfinalized salaries found for this month/year' });
    }

    // Update all salaries to finalized
    await EmployeeSalary.update(
      { is_finalized: true },
      { where: { month, year, is_finalized: false } }
    );

    res.json({
      message: `Finalized ${salaries.length} salary entries for ${month}/${year}`,
      count: salaries.length
    });
  } catch (error) {
    console.error('Error finalizing salaries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get salary by ID
const getSalaryById = async (req, res) => {
  try {
    const { id } = req.params;
    const salary = await EmployeeSalary.findByPk(id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name', 'designation']
        }
      ]
    });

    if (!salary) {
      return res.status(404).json({ error: 'Salary entry not found' });
    }

    res.json(salary);
  } catch (error) {
    console.error('Error fetching salary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create individual salary entry
const createSalary = async (req, res) => {
  try {
    const { employee_id, month, year, basic_salary, bonus, deductions } = req.body;

    // Validate required fields
    if (!employee_id || !month || !year || basic_salary === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if employee exists
    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if salary already exists for this employee in this month/year
    const existingSalary = await EmployeeSalary.findOne({
      where: {
        employee_id,
        month,
        year
      }
    });

    if (existingSalary) {
      return res.status(400).json({ error: 'Salary entry already exists for this employee in this month/year' });
    }

    // Calculate net salary
    const basicSalary = parseFloat(basic_salary) || 0;
    const bonusAmount = parseFloat(bonus) || 0;
    const deductionsAmount = parseFloat(deductions) || 0;
    const netSalary = basicSalary + bonusAmount - deductionsAmount;

    // Create salary entry
    const salary = await EmployeeSalary.create({
      employee_id,
      month,
      year,
      basic_salary: basicSalary,
      bonus: bonusAmount,
      deductions: deductionsAmount,
      net_salary: netSalary,
      is_finalized: false
    });

    // Fetch the created salary with employee details
    const createdSalary = await EmployeeSalary.findByPk(salary.id, {
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['id', 'name', 'designation']
        }
      ]
    });

    res.status(201).json(createdSalary);
  } catch (error) {
    console.error('Error creating salary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete salary entry
const deleteSalary = async (req, res) => {
  try {
    const { id } = req.params;

    const salary = await EmployeeSalary.findByPk(id);
    if (!salary) {
      return res.status(404).json({ error: 'Salary entry not found' });
    }

    if (salary.is_finalized) {
      return res.status(400).json({ error: 'Cannot delete finalized salary' });
    }

    await salary.destroy();
    res.json({ message: 'Salary entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting salary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getSalariesWithPagination,
  generateSalaries,
  createSalary,
  updateSalary,
  finalizeSalaries,
  getSalaryById,
  deleteSalary
};
