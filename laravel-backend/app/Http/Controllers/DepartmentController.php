<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Services;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;

class DepartmentController extends Controller
{
    protected $services;

    public function __construct(Services $services)
    {
        $this->services = $services;
    }

    /**
     * GET /admin/departments
     * Display a listing of all departments.
     */
    public function index(Request $request)
    {
        try {
            $filters = $request->only(['search']);
            $departments = $this->services->getAllDepartments($filters);
            
            return response()->json([
                'success' => true,
                'data' => $departments
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch departments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /admin/departments
     * Store a newly created department.
     */
    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'degree_program' => 'required|string|max:50|unique:departments,degree_program',
                'college' => 'required|string|max:255'
            ]);

            $department = $this->services->createDepartment($data);
            
            return response()->json([
                'success' => true,
                'message' => 'Department created successfully',
                'data' => $department
            ], 201);
            
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create department',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /admin/departments/{id}
     * Display the specified department.
     */
    public function show($id)
    {
        try {
            $department = $this->services->getDepartmentById($id);
            
            return response()->json([
                'success' => true,
                'data' => $department
            ], 200);
            
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch department',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT/PATCH /admin/departments/{id}
     * Update the specified department.
     */
    public function update(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'degree_program' => 'sometimes|string|max:50|unique:departments,degree_program,' . $id,
                'college' => 'sometimes|string|max:255'
            ]);

            $department = $this->services->updateDepartment($id, $data);
            
            return response()->json([
                'success' => true,
                'message' => 'Department updated successfully',
                'data' => $department
            ], 200);
            
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update department',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /admin/departments/{id}
     * Remove the specified department.
     */
    public function destroy($id)
    {
        try {
            $this->services->deleteDepartment($id);
            
            return response()->json([
                'success' => true,
                'message' => 'Department deleted successfully'
            ], 200);
            
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Department not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete department',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}