import React from 'react';

// Update dynamic imports to use default exports
const JobBoard = React.lazy(() => import("@/components/JobBoard"));
const TechnicianDashboard = React.lazy(() => import("@/components/TechnicianDashboard"));
const JobDetailsModal = React.lazy(() => import("@/components/JobDetailsModal"));
const PartsRunnerDashboard = React.lazy(() => import("@/components/PartsRunnerDashboard"));
const RoadServiceDashboard = React.lazy(() => import("@/components/RoadServiceDashboard"));
const ReportsAnalytics = React.lazy(() => import("@/components/ReportsAnalytics"));
const AIHelper = React.lazy(() => import("@/components/AIHelper"));
const InvoicingSystem = React.lazy(() => import("@/components/InvoicingSystem"));
const ShopSettings = React.lazy(() => import("@/components/ShopSettings"));
const TechnicianManagement = React.lazy(() => import("@/components/TechnicianManagement"));
const TechnicianList = React.lazy(() => import("@/components/TechnicianList"));
const BusinessCosts = React.lazy(() => import("@/components/BusinessCosts"));
const AIJobAnalyzer = React.lazy(() => import("@/components/AIJobAnalyzer"));
const WorkflowOrchestrator = React.lazy(() => import("@/components/WorkflowOrchestrator"));
const PartsLookupTool = React.lazy(() => import("@/components/PartsLookupTool"));

// Rest of the file remains the same
export { /* existing exports */ }