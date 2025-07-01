
import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { PatientLabResult } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { Loader } from '@/components/ui/loader';

export function LabResultsList() {
  const { data: labResults, isLoading } = useQuery({
    queryKey: ['/api/patient-lab-results'],
    refetchInterval: 5000
  });

  const recentResults = labResults?.sort((a, b) => 
    new Date(b.resultDate).getTime() - new Date(a.resultDate).getTime()
  ).slice(0, 5) || [];

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Card className="bg-white shadow rounded-lg">
      <CardHeader className="py-4 px-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-900">
            Derniers résultats de laboratoire
          </CardTitle>
          <Link 
            href="/lab-results" 
            className="text-sm font-medium text-primary hover:text-primary-dark"
          >
            Voir tous
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ul className="divide-y divide-gray-200">
          {recentResults?.length > 0 ? (
            recentResults.map((result) => (
              <li key={result._id} className="hover:bg-gray-50">
                <div className="px-6 py-4 flex items-center">
                  <div className="min-w-0 flex-1 flex items-center">
                    {result.patient && result.patient.user && (
                      <div className="min-w-0 flex-1 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {result.patient.user.firstName} {result.patient.user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {result.labTest.testName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="ml-6 flex flex-col items-end">
                    <p className="text-sm font-medium text-gray-900">
                      {result.resultValue} {result.labTest.unit}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(result.resultDate)}
                    </p>
                    <p className={`text-xs mt-1 ${
                      result.resultValue > result.labTest.normalMax ? 'text-red-600' :
                      result.resultValue < result.labTest.normalMin ? 'text-red-600' :
                      'text-green-600'
                    }`}>
                      {result.resultValue > result.labTest.normalMax ? 'Au-dessus de la normale' :
                       result.resultValue < result.labTest.normalMin ? 'En dessous de la normale' :
                       'Normal'}
                    </p>
                  </div>
                </div>
              </li>
            ))
          ) : (
            <li className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500">Aucun résultat de laboratoire disponible</p>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
