package services

import (
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// Shared errors used across multiple service files.
var (
	errInvalidPageToken = status.Error(codes.InvalidArgument, "invalid page_token")
	errInvalidParent    = status.Error(codes.InvalidArgument, "invalid parent")

	// used by account_group, account, budget, import_source, transaction_account, report_template, report services
	errOrganizationNotFound = status.Error(codes.NotFound, "organization not found")

	// used by account_group, account_group_assignment services
	errAccountGroupNotFound = status.Error(codes.NotFound, "account group not found")

	// used by account_group_assignment, budget_account_value, transaction_account_assignment services
	errAccountNotFound  = status.Error(codes.NotFound, "account not found")
	errInvalidAccountID = status.Error(codes.InvalidArgument, "invalid account_id")

	// used by import_source_period, transaction_account services
	errImportSourceNotFound = status.Error(codes.NotFound, "import source not found")

	// used by transaction, transaction_account_assignment services
	errTransactionNotFound        = status.Error(codes.NotFound, "transaction not found")
	errTransactionAccountNotFound = status.Error(codes.NotFound, "transaction account not found")

	// used by account_group_assignment, transaction_account_assignment services
	errAssignmentRequired      = status.Error(codes.InvalidArgument, "assignment is required")
	errInvalidAssignmentName   = status.Error(codes.InvalidArgument, "invalid assignment name")
	errAssignmentNotFound      = status.Error(codes.NotFound, "assignment not found")
	errAssignmentAlreadyExists = status.Error(codes.AlreadyExists, "assignment with this ID already exists")
	errFailedGetAssignment     = status.Error(codes.Internal, "failed to get assignment")
	errFailedListAssignments   = status.Error(codes.Internal, "failed to list assignments")
	errFailedCreateAssignment  = status.Error(codes.Internal, "failed to create assignment")
	errFailedUpdateAssignment  = status.Error(codes.Internal, "failed to update assignment")
	errFailedDeleteAssignment  = status.Error(codes.Internal, "failed to delete assignment")
)
