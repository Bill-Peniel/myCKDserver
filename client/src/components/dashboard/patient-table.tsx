import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { AvatarName } from '@/components/ui/avatar-name';
import { Badge } from '@/components/ui/badge';
import { Link } from 'wouter';
import { formatDate, getCKDStageColor } from '@/lib/utils';
import { Patient } from '@/lib/types';

interface PatientTableProps {
  patients: Patient[];
  totalPatients: number;
}

export function PatientTable({ patients, totalPatients }: PatientTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 4;

  // Calculate pagination info
  const totalPages = Math.ceil(totalPatients / patientsPerPage);
  const startItem = (currentPage - 1) * patientsPerPage + 1;
  const endItem = Math.min(startItem + patientsPerPage - 1, totalPatients);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="flex items-center justify-between py-4 px-6 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Patients récents</h2>
        <Link href="/patients" className="text-sm font-medium text-primary hover:text-primary-dark">
          Voir tout
        </Link>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Âge/Genre
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stade MRC
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dernier DFG
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dernière visite
              </TableHead>
              <TableHead className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-200">
            {patients.map(patient => {
              const stageColors = getCKDStageColor(patient.ckdStage);

              return (
                <TableRow key={patient.id} className="hover:bg-gray-50">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <AvatarName
                      firstName={patient.user.firstName}
                      lastName={patient.user.lastName}
                      showEmail={false}
                      gender={patient.gender}
                    />
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">P-{patient._id}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{patient.age || '--'} / {patient.gender || '--'}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className={`${stageColors.bg} ${stageColors.text} px-2 py-1 text-xs`}>
                      {patient.ckdStage}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.latestEGFR ? `${patient.latestEGFR} mL/min` : 'No data'}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {patient.lastVisit ? formatDate(patient.lastVisit) : 'No visits'}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`/patients/${patient.id}`} className="text-primary hover:text-primary-dark">
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>

        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startItem}</span> to <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalPatients}</span> patients
            </p>
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                // Logic to show appropriate page numbers
                let pageNum = index + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = index + currentPage - 2;
                  if (pageNum > totalPages) {
                    return null;
                  }
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <PaginationItem>
                    <span className="px-4 py-2 text-sm">...</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink
                      onClick={() => setCurrentPage(totalPages)}
                      isActive={currentPage === totalPages}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  );
}