<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\Services;

class SubjectController extends Controller
{
    //

    public function __construct(protected Services $services){
        
    }

    public function store(Request $request){

   $data = $request->validate([

    'subject_code' => 'string|max:10',
    'subject' => 'string|max:100',
    'department' => 'string|max:50'
    ]);

    $subject = $this->services->createSubject($data);
 return response()->json($subject, 201); 
    }

    public function index(Request $request)
    {
        try {
            $filters = $request->only(['department', 'search', 'sort_by', 'sort_order']);
            $subjects = $this->services->getAllSubjects($filters);
            
            return response()->json([
                'success' => true,
                'data' => $subjects
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created subject.
     */
 

    /**
     * Display the specified subject.
     */
    public function show($id)
    {
        try {
            $subject = $this->services->getSubjectById($id);
            
            return response()->json([
                'success' => true,
                'data' => $subject
            ], 200);
            
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Subject not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch subject',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified subject.
     */
    public function update(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'subject_code' => 'sometimes|string|max:20|unique:subjects,subject_code,' . $id,
                'subject' => 'sometimes|string|max:255',
                'department' => 'sometimes|string|max:50|in:CCS,CBA,CTE,CCJ,CHM,CAS'
            ]);

            $subject = $this->services->updateSubject($id, $data);
            
            return response()->json([
                'success' => true,
                'message' => 'Subject updated successfully',
                'data' => $subject
            ], 200);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Subject not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update subject',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified subject.
     */
    public function destroy($id)
    {
        try {
            $this->services->deleteSubject($id);
            
            return response()->json([
                'success' => true,
                'message' => 'Subject deleted successfully'
            ], 200);
            
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Subject not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete subject',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get subjects by department.
     */
    public function getByDepartment($department)
    {
        try {
            $subjects = $this->services->getSubjectsByDepartment($department);
            
            return response()->json([
                'success' => true,
                'data' => $subjects
            ], 200);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk store multiple subjects.
     */
    public function bulkStore(Request $request)
    {
        try {
            $data = $request->validate([
                'subjects' => 'required|array|min:1',
                'subjects.*.subject_code' => 'required|string|max:20|distinct',
                'subjects.*.subject' => 'required|string|max:255',
                'subjects.*.department' => 'required|string|max:50|in:CCS,CBA,CTE,CCJ,CHM,CAS'
            ]);

            $createdSubjects = [];
            $errors = [];

            foreach ($data['subjects'] as $index => $subjectData) {
                try {
                    // Check for duplicate in database
                    $existing = \App\Models\SubjectModel::where('subject_code', $subjectData['subject_code'])->first();
                    if ($existing) {
                        $errors[] = "Row " . ($index + 1) . ": Subject code '{$subjectData['subject_code']}' already exists";
                        continue;
                    }

                    $createdSubjects[] = $this->services->createSubject($subjectData);
                } catch (\Exception $e) {
                    $errors[] = "Row " . ($index + 1) . ": " . $e->getMessage();
                }
            }

            return response()->json([
                'success' => true,
                'message' => count($createdSubjects) . ' subjects created successfully',
                'data' => $createdSubjects,
                'errors' => $errors
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create subjects',
                'error' => $e->getMessage()
            ], 500);
        }
    }

}
