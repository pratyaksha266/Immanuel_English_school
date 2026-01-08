import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit2, Trash2, Eye, Download } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function Students() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [studentToView, setStudentToView] = useState<any>(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        admission_number: '',
        roll_number: '',
        phone: '',
        gender: 'M',
        dob: '',
        email: '',
        address: '',
        class_obj: '',
        section: '',
        hostel: '',
        room: ''
    });

    const [selectedClass, setSelectedClass] = useState('');
    // New state for filters and edit-section selection (which was missing in base restore but likely needed)
    // Wait, in base restore, `section` dropdown logic relied on `selectedClass` state.
    // Base restore had: const [selectedClass, setSelectedClass] = useState('');
    // And handleClassChange updated it.
    // The edit form uses `formData.section` which depends on `sections` list which depends on `selectedClass`.

    // I need to make sure I don't conflict names.
    // `selectedClass` matches the one used for Form.
    // I will use `filterClass` and `filterSection` for the main list filters.

    const [filterClass, setFilterClass] = useState('');
    const [filterSection, setFilterSection] = useState('');
    const queryClient = useQueryClient();

    // Fetch Lists
    // classes: for both filter and form
    const { data: classes } = useQuery({ queryKey: ['classes'], queryFn: async () => (await api.get('/classes/')).data });

    // sections: This is tricky. 
    // The form needs sections for `selectedClass` (the one being edited).
    // The filter needs sections for `filterClass`.
    // We should probably fetch them separately or all?
    // Let's fetch sections for form based on `selectedClass` (as before).
    const { data: formSections } = useQuery({
        queryKey: ['sections', selectedClass],
        queryFn: async () => (await api.get(`/sections/?class_obj=${selectedClass}`)).data,
        enabled: !!selectedClass
    });

    // We also need sections for the FILTER dropdown if a filter class is selected.
    const { data: filterSections } = useQuery({
        queryKey: ['sections', filterClass],
        queryFn: async () => (await api.get(`/sections/?class_obj=${filterClass}`)).data,
        enabled: !!filterClass
    });

    const { data: hostels } = useQuery({ queryKey: ['hostels'], queryFn: async () => (await api.get('/hostels/')).data });

    // Fetch Students with Filters
    const { data: students, isLoading } = useQuery({
        queryKey: ['students', search, filterClass, filterSection],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (filterClass) params.append('class_obj', filterClass);
            if (filterSection) params.append('section', filterSection);
            return (await api.get(`/students/?${params.toString()}`)).data;
        }
    });

    const filteredStudents = students;

    // Additional effect to prepopulate form when editing
    useEffect(() => {
        if (selectedStudentForEdit) {
            setFormData({
                first_name: selectedStudentForEdit.first_name || '',
                last_name: selectedStudentForEdit.last_name || '',
                admission_number: selectedStudentForEdit.admission_number || '',
                roll_number: selectedStudentForEdit.roll_number || '',
                phone: selectedStudentForEdit.phone || '',
                gender: selectedStudentForEdit.gender || 'M',
                dob: selectedStudentForEdit.date_of_birth || '',
                email: selectedStudentForEdit.email || '',
                address: selectedStudentForEdit.address || '',
                class_obj: selectedStudentForEdit.class_obj || '',
                section: selectedStudentForEdit.section || '',
                hostel: selectedStudentForEdit.hostel || '',
                room: selectedStudentForEdit.room || ''
            });
            setSelectedClass(selectedStudentForEdit.class_obj || '');
        } else {
            setFormData({
                first_name: '', last_name: '', admission_number: '', roll_number: '', phone: '',
                gender: 'M', dob: '', email: '', address: '',
                class_obj: '', section: '', hostel: '', room: ''
            });
            setSelectedClass('');
        }
    }, [selectedStudentForEdit]);


    const createMutation = useMutation({
        mutationFn: (data: any) => {
            // Map frontend fields to backend model fields
            const payload = { 
                ...data, 
                date_of_birth: data.dob,
                personal_phone: data.phone 
            };
            
            // Remove frontend-only fields that are now mapped or not in model
            delete (payload as any).dob;
            delete (payload as any).phone;
            delete (payload as any).address; // student model doesn't have address (guardian does)

            if (!payload.hostel) payload.hostel = null;
            if (!payload.room) payload.room = null;
            if (!payload.section) payload.section = null;
            if (!payload.class_obj) payload.class_obj = null;

            if (selectedStudentForEdit) {
                return api.patch(`/students/${selectedStudentForEdit.id}/`, payload);
            }
            return api.post('/students/', payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            setIsModalOpen(false);
            setSelectedStudentForEdit(null);
            alert(selectedStudentForEdit ? 'Student updated!' : 'Student created!');
        },
        onError: (err: any) => {
            const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
            alert('Failed to save student: ' + errorMsg);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/students/${id}/`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            alert('Student deleted!');
        },
        onError: (err: any) => alert('Failed to delete: ' + (err.response?.data?.error || err.message))
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        createMutation.mutate(formData);
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleClassChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const clsId = e.target.value;
        setSelectedClass(clsId);
        setFormData({ ...formData, class_obj: clsId, section: '' });
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/export/?type=students', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'students.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export failed", error);
            alert("Failed to export data");
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Students</h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
                    >
                        <Download size={20} /> Export CSV
                    </button>
                    <button
                        onClick={() => {
                            setSelectedStudentForEdit(null);
                            setFormData({
                                first_name: '',
                                last_name: '',
                                admission_number: '',
                                roll_number: '',
                                phone: '',
                                gender: 'M',
                                dob: '',
                                email: '',
                                address: '',
                                class_obj: '',
                                section: '',
                                hostel: '',
                                room: ''
                            });
                            setSelectedClass('');
                            setIsModalOpen(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                    >
                        <Plus size={20} /> Add Student
                    </button>
                </div>
            </div>

            <div className="mb-4 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                </div>
                <select
                    value={filterClass}
                    onChange={(e) => { setFilterClass(e.target.value); setFilterSection(''); }}
                    className="border rounded-lg px-4 py-2 bg-white"
                >
                    <option value="">All Classes</option>
                    {classes?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                    className="border rounded-lg px-4 py-2 bg-white"
                    disabled={!filterClass}
                >
                    <option value="">All Sections</option>
                    {filterSections?.map((s: any) =>
                        <option key={s.id} value={s.id}>{s.name}</option>
                    )}
                </select>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {isLoading ? <tr><td colSpan={4} className="p-4 text-center">Loading...</td></tr> :
                            filteredStudents?.map((student: any) => (
                                <tr key={student.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                {student.first_name[0]}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{student.first_name} {student.last_name}</div>
                                                <div className="text-sm text-gray-500">{student.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.admission_number}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.phone}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => { setStudentToView(student); setIsViewModalOpen(true); }}
                                            className="text-blue-600 hover:text-blue-900 mr-4 inline-flex"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        <button
                                            onClick={() => { setSelectedStudentForEdit(student); setIsModalOpen(true); }}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4 inline-flex"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => { if (confirm('Delete student?')) deleteMutation.mutate(student.id); }}
                                            className="text-red-600 hover:text-red-900 inline-flex"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedStudentForEdit ? "Edit Student" : "Add New Student"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <input name="first_name" value={formData.first_name} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <input name="last_name" value={formData.last_name} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Admission Number</label>
                            <input name="admission_number" value={formData.admission_number} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Roll Number</label>
                            <input name="roll_number" value={formData.roll_number} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Class</label>
                            <select name="class_obj" value={formData.class_obj} onChange={handleClassChange} className="mt-1 block w-full border rounded-md p-2" required>
                                <option value="">Select Class</option>
                                {classes?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Section</label>
                            <select name="section" value={formData.section} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required disabled={!selectedClass}>
                                <option value="">Select Section</option>
                                {/* Note: We use formSections here, not filterSections */}
                                {formSections?.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Hostel</label>
                            <select name="hostel" value={formData.hostel} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2">
                                <option value="">Select Hostel</option>
                                {hostels?.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Gender</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2">
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                                <option value="O">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                            <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="mt-1 block w-full border rounded-md p-2" required />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            {createMutation.isPending ? 'Saving...' : (selectedStudentForEdit ? 'Update Student' : 'Save Student')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* View Student Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Student Details">
                {studentToView && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="col-span-2 flex items-center gap-3 pb-4 border-b">
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl">
                                    {studentToView.first_name[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{studentToView.first_name} {studentToView.last_name}</h3>
                                    <p className="text-gray-500">{studentToView.email}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-gray-500 text-xs uppercase font-semibold">Admission No</p>
                                <p className="font-medium">{studentToView.admission_number || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-semibold">Roll No</p>
                                <p className="font-medium">{studentToView.roll_number || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-semibold">Class</p>
                                {/* We might need to find class name from ID if not populated, but assuming ID for now if list is loaded */}
                                <p className="font-medium">
                                    {classes?.find((c: any) => c.id === studentToView.class_obj)?.name || studentToView.class_obj || '-'}
                                    {/* Could also find section name similarly */}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-semibold">Phone</p>
                                <p className="font-medium">{studentToView.phone || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase font-semibold">Review Hosteller</p>
                                <p className="font-medium">{studentToView.hostel ? 'Yes' : 'No'}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Linked Parents</h4>
                            {!studentToView.parents || studentToView.parents.length === 0 ? (
                                <p className="text-sm text-gray-500 italic">No parents linked yet.</p>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="min-w-full text-sm divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium text-gray-500">Name</th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-500">Relation</th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-500">Phone</th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-500">Primary</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {studentToView.parents.map((p: any) => (
                                                <tr key={p.id}>
                                                    <td className="px-4 py-2 font-medium">{p.parent_name}</td>
                                                    <td className="px-4 py-2 text-gray-600">{p.relationship}</td>
                                                    <td className="px-4 py-2 text-gray-600">{p.parent_phone}</td>
                                                    <td className="px-4 py-2">
                                                        {p.is_primary && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Primary</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    );
}
