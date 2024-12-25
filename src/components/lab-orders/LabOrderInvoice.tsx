import React, { useState } from 'react';
import { Plus, Printer, X, List, Search } from 'lucide-react';
import type { Prescription, LabInvoice } from '../../types';
import { useDiagnosticTestStore } from '../../stores/diagnosticTestStore';
import { useLabInvoiceStore } from '../../stores/labInvoiceStore';
import { useGlobalSettingsStore } from '../../stores/globalSettingsStore';
import { LabInvoiceList } from './LabInvoiceList';

interface LabOrderInvoiceProps {
  prescriptions: Prescription[];
}

export const LabOrderInvoice: React.FC<LabOrderInvoiceProps> = ({ prescriptions }) => {
  const { tests: diagnosticTests } = useDiagnosticTestStore();
  const { addInvoice } = useLabInvoiceStore();
  const [view, setView] = useState<'list' | 'search' | 'create' | 'invoice'>('list');
  const [prescriptionId, setPrescriptionId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [patientName, setPatientName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTests = diagnosticTests.filter(test => 
    test.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTests.includes(test.name)
  );

  const handleSearch = () => {
    if (!prescriptionId.trim()) {
      alert('Please enter a Prescription ID');
      return;
    }

    const prescription = prescriptions.find(p => 
      p.prescriptionId.toLowerCase() === prescriptionId.toLowerCase()
    );

    if (prescription && prescription.labTests && prescription.labTests.length > 0) {
      setSelectedPrescription(prescription);
      setView('invoice');
    } else {
      alert('No lab tests found for this prescription ID');
    }
  };

  const handleCreateManualOrder = () => {
    if (!patientName.trim()) {
      alert('Please enter patient name');
      return;
    }
    if (selectedTests.length === 0) {
      alert('Please select at least one test');
      return;
    }

    const manualPrescription: Prescription = {
      prescriptionId: 'M' + Date.now(),
      visitId: 'MV' + Date.now(),
      patientId: 'MP' + Date.now(),
      patientName: patientName.trim(),
      date: new Date().toISOString(),
      labTests: selectedTests
    };

    setSelectedPrescription(manualPrescription);
    setView('invoice');
  };

  const handleAddTest = (testName: string) => {
    if (!selectedTests.includes(testName)) {
      setSelectedTests(prev => [...prev, testName]);
      setSearchTerm('');
    }
  };

  const handleRemoveTest = (testName: string) => {
    setSelectedTests(prev => prev.filter(test => test !== testName));
  };

  const getTestPrice = (testName: string): number => {
    const test = diagnosticTests.find(t => t.name === testName);
    return test?.price || 0;
  };

  const calculateTotal = (tests: string[]) => {
    return tests.reduce((total, test) => total + getTestPrice(test), 0);
  };

  const calculateDiscountedTotal = (tests: string[], discountPercentage: number) => {
    const total = calculateTotal(tests);
    const discountAmount = (total * discountPercentage) / 100;
    return total - discountAmount;
  };

  const handleSave = () => {
    if (!selectedPrescription) return;

    const { labName, labLogo } = useGlobalSettingsStore.getState();

    const invoice: LabInvoice = {
      id: `INV${Date.now()}`,
      date: new Date().toISOString(),
      prescriptionId: selectedPrescription.prescriptionId,
      patientName: selectedPrescription.patientName,
      tests: selectedPrescription.labTests || [],
      subtotal: calculateTotal(selectedPrescription.labTests || []),
      discount,
      total: calculateDiscountedTotal(selectedPrescription.labTests || [], discount),
      status: 'saved',
      labName,
      labLogo
    };

    addInvoice(invoice);
    resetForm();
  };

  const resetForm = () => {
    setPrescriptionId('');
    setDiscount(0);
    setSelectedPrescription(null);
    setSelectedTests([]);
    setPatientName('');
    setSearchTerm('');
    setView('list');
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-md ${view === 'list' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            <List className="h-5 w-5 mr-2 inline" />
            List
          </button>
          <button
            onClick={() => setView('search')}
            className={`px-4 py-2 rounded-md ${view === 'search' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            <Search className="h-5 w-5 mr-2 inline" />
            Search
          </button>
          <button
            onClick={() => setView('create')}
            className={`px-4 py-2 rounded-md ${view === 'create' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            <Plus className="h-5 w-5 mr-2 inline" />
            Create
          </button>
        </div>
      </div>

      {/* List View */}
      {view === 'list' && (
        <LabInvoiceList 
          invoices={[]} 
          onViewInvoice={() => {}} 
        />
      )}

      {/* Search View */}
      {view === 'search' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-4 mb-6">
            <input
              type="text"
              placeholder="Enter Prescription ID"
              value={prescriptionId}
              onChange={(e) => setPrescriptionId(e.target.value)}
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Search className="h-5 w-5 mr-2 inline" />
              Search
            </button>
          </div>
        </div>
      )}

      {/* Create Manual Order View */}
      {view === 'create' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            {/* Patient Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Patient Name</label>
              <input
                type="text"
                placeholder="Enter patient name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Test Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Tests</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchTerm && filteredTests.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredTests.map((test) => (
                      <div
                        key={test.name}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleAddTest(test.name)}
                      >
                        {test.name} - ₹{test.price}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected Tests */}
            {selectedTests.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Selected Tests</label>
                <div className="flex flex-wrap gap-2">
                  {selectedTests.map((test) => (
                    <div
                      key={test}
                      className="flex items-center bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm"
                    >
                      {test}
                      <button
                        onClick={() => handleRemoveTest(test)}
                        className="ml-2 text-indigo-500 hover:text-indigo-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create Order Button */}
            <div className="flex justify-end">
              <button
                onClick={handleCreateManualOrder}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice View */}
      {view === 'invoice' && selectedPrescription && (
        <div className="bg-white rounded-lg p-6">
          {/* Invoice Content */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Lab Order Invoice</h2>
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <Printer className="h-4 w-4 mr-2 inline" />
                  Save & Print
                </button>
              </div>
            </div>

            {/* Patient Details */}
            <div className="border-b pb-4">
              <p><strong>Patient Name:</strong> {selectedPrescription.patientName}</p>
              <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            </div>

            {/* Tests Table */}
            <div>
              <h3 className="text-lg font-medium mb-2">Tests</h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Test Name</th>
                    <th className="text-right py-2">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPrescription.labTests?.map((test) => (
                    <tr key={test} className="border-b">
                      <td className="py-2">{test}</td>
                      <td className="text-right py-2">₹{getTestPrice(test)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total and Discount */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{calculateTotal(selectedPrescription.labTests || [])}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Discount (%):</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-20 px-2 py-1 border rounded"
                />
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>₹{calculateDiscountedTotal(selectedPrescription.labTests || [], discount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
