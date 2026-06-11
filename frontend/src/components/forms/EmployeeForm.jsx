'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';

const MODULES = [
  { id: 'loans', label: 'Loans (Main)' },
  { id: 'weeklyLoans', label: 'Weekly Loans' },
  { id: 'dailyLoans', label: 'Daily Loans' },
  { id: 'interestLoans', label: 'Interest Loans' },
  { id: 'emis', label: 'EMIs' },
  { id: 'seizedVehicles', label: 'Seized Vehicles' },
  { id: 'payments', label: 'Payments' },
  { id: 'documents', label: 'Documents' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'expenses', label: 'Expenses' },
];

const defaultPermissions = MODULES.reduce((acc, mod) => {
  acc[mod.id] = { view: false, create: false, edit: false, delete: false };
  return acc;
}, {});

const employeeSchema = z.object({
  operatorName: z.string().min(2, 'Name must be at least 2 characters'),
  protocolLevel: z.string().min(1, 'Protocol level is required'),
  credentialId: z.string().email('Invalid email address'),
  password: z.string().optional(),
  accessKey: z.string().min(2, 'Access key is required'),
  paymentApproval: z.boolean().default(false),
  permissions: z.any().default(defaultPermissions),
  registryStatus: z.string().default('Active'),
});

export default function EmployeeForm({ employee, onSubmit, onClose }) {
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: employee || {
      operatorName: '',
      protocolLevel: 'OPERATOR (EMPLOYEE)',
      credentialId: '',
      password: '',
      accessKey: '',
      paymentApproval: false,
      permissions: defaultPermissions,
      registryStatus: 'Active',
    },
  });

  const formValues = watch();

  const handleNext = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['operatorName', 'protocolLevel', 'credentialId', 'password', 'accessKey'];
    }
    
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setStep((prev) => prev - 1);
  };

  const submitForm = (data) => {
    onSubmit(data);
  };

  const handlePermissionChange = (moduleId, action, checked) => {
    const currentPerms = formValues.permissions;
    const newPerms = {
      ...currentPerms,
      [moduleId]: {
        ...currentPerms[moduleId],
        [action]: checked,
      },
    };
    // Auto-check View if Create, Edit, or Delete is checked
    if (checked && action !== 'view') {
      newPerms[moduleId].view = true;
    }
    setValue('permissions', newPerms);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {employee ? 'Edit Operator' : 'New Employee'}
            </h2>
            <p className="text-xs font-medium text-gray-500">
              {step === 1 && 'Step 1 of 3: Credential Entry'}
              {step === 2 && 'Step 2 of 3: Access Control'}
              {step === 3 && 'Step 3 of 3: Finalize Review'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar">
          <form id="employee-form" onSubmit={handleSubmit(submitForm)}>
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">Full Name</label>
                    <input
                      type="text"
                      placeholder="E.G. JOHN DOE"
                      {...register('operatorName')}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {errors.operatorName && <p className="mt-1 text-xs text-red-500">{errors.operatorName.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">Protocol Level</label>
                    <select
                      {...register('protocolLevel')}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    >
                      <option value="OPERATOR (EMPLOYEE)">OPERATOR (EMPLOYEE)</option>
                      <option value="SUPER ADMIN">SUPER ADMIN</option>
                      <option value="MANAGER">MANAGER</option>
                    </select>
                    {errors.protocolLevel && <p className="mt-1 text-xs text-red-500">{errors.protocolLevel.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">Email</label>
                    <input
                      type="email"
                      placeholder="admin@loanapp.com"
                      {...register('credentialId')}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {errors.credentialId && <p className="mt-1 text-xs text-red-500">{errors.credentialId.message}</p>}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-700">Set Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      {...register('password')}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-bold text-gray-700">Set Access Key</label>
                    <input
                      type="text"
                      placeholder="E.G. OP-44"
                      {...register('accessKey')}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50/50 px-3 py-2.5 text-sm font-medium uppercase focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    {errors.accessKey && <p className="mt-1 text-xs text-red-500">{errors.accessKey.message}</p>}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Privilege Matrix</h3>
                  <p className="text-xs text-gray-500">Configure granular action permissions</p>
                </div>

                <div className="rounded-lg border border-gray-200 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 font-bold text-gray-700">Module</th>
                        <th className="px-2 py-2 font-bold text-center text-gray-700 w-16">View</th>
                        <th className="px-2 py-2 font-bold text-center text-gray-700 w-16">Create</th>
                        <th className="px-2 py-2 font-bold text-center text-gray-700 w-16">Edit</th>
                        <th className="px-2 py-2 font-bold text-center text-gray-700 w-16">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {MODULES.map((mod) => (
                        <tr key={mod.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-1.5 font-medium text-gray-800">{mod.label}</td>
                          {['view', 'create', 'edit', 'delete'].map((action) => (
                            <td key={action} className="px-2 py-1.5 text-center">
                              <input
                                type="checkbox"
                                checked={formValues.permissions?.[mod.id]?.[action] || false}
                                onChange={(e) => handlePermissionChange(mod.id, action, e.target.checked)}
                                className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Payment Approval Authority</h4>
                      <p className="mt-0.5 text-[11px] text-gray-500 leading-relaxed">
                        If enabled, the employee can mark payments as PAID directly. If disabled, all payments will require Super Admin approval.
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        {...register('paymentApproval')}
                        className="peer sr-only"
                      />
                      <div className="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-b border-gray-100">
                    <div className="p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Full Name</p>
                      <p className="mt-1 font-bold text-gray-900">{formValues.operatorName}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Registry Type</p>
                      <p className="mt-1 font-bold text-gray-900">{formValues.protocolLevel}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 border-b border-gray-100">
                    <div className="p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Email Address</p>
                      <p className="mt-1 font-bold text-gray-900">{formValues.credentialId}</p>
                    </div>
                    <div className="p-4">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Access Key</p>
                      <p className="mt-1 font-bold text-gray-900 uppercase">{formValues.accessKey}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-3">Assigned Permissions Details</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(formValues.permissions || {}).map(([modId, actions]) => {
                        const activeActions = Object.entries(actions)
                          .filter(([_, isActive]) => isActive)
                          .map(([actionName]) => actionName.charAt(0).toUpperCase() + actionName.slice(1));
                          
                        if (activeActions.length === 0) return null;
                        
                        const moduleLabel = MODULES.find(m => m.id === modId)?.label || modId;
                        
                        return (
                          <div key={modId} className="flex flex-col rounded-lg border border-gray-200 bg-gray-50/50 p-3">
                            <span className="text-xs font-bold text-gray-900">{moduleLabel}</span>
                            <span className="mt-1 text-[10px] font-bold text-primary uppercase tracking-wider">
                              {activeActions.join(', ')}
                            </span>
                          </div>
                        );
                      })}
                      {formValues.paymentApproval && (
                        <div className="flex flex-col rounded-lg border border-green-200 bg-green-50/50 p-3">
                          <span className="text-xs font-bold text-green-900">Payment Authority</span>
                          <span className="mt-1 text-[10px] font-bold text-green-600 uppercase tracking-wider">
                            Authorized
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-gray-50/50 rounded-b-2xl">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              Previous
            </button>
          ) : (
            <div></div> // Spacer
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-secondary transition-all"
            >
              Next: {step === 1 ? 'Access Control' : 'Finalize Review'}
            </button>
          ) : (
            <button
              form="employee-form"
              type="submit"
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/30 hover:bg-secondary transition-all"
            >
              Finalize Authorization
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
