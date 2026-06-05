package grpc_test

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
)

var _ = Describe("TransactionAccountService", func() {
	var ctx context.Context
	var orgName string
	var importSourceID string

	BeforeEach(func() {
		ctx = context.Background()
		org, err := OrgClient.CreateOrganization(ctx, &gen.CreateOrganizationRequest{
			Organization: &gen.Organization{DisplayName: "Test Org for TransactionAccounts"},
		})
		Expect(err).NotTo(HaveOccurred())
		orgName = org.Name

		// Create an import source as prerequisite
		importSource, err := ImportSourceClient.CreateImportSource(ctx, &gen.CreateImportSourceRequest{
			Parent: orgName,
			ImportSource: &gen.ImportSource{
				DisplayName: "Test Import Source",
			},
		})
		Expect(err).NotTo(HaveOccurred())
		importSourceID = importSource.Uid
	})

	Describe("CreateTransactionAccount", func() {
		It("creates a transaction account and returns it with server-populated fields", func() {
			resp, err := TransactionAccountClient.CreateTransactionAccount(ctx, &gen.CreateTransactionAccountRequest{
				Parent: orgName,
				TransactionAccount: &gen.TransactionAccount{
					Code:               "DE89370400440532013000",
					ImportSourceId:     importSourceID,
					DisplayName:        "Test Bank Account",
					DisplayDescription: "Main checking account",
				},
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.Name).NotTo(BeEmpty())
			Expect(resp.Uid).NotTo(BeEmpty())
			Expect(resp.Code).To(Equal("DE89370400440532013000"))
			Expect(resp.ImportSourceId).To(Equal(importSourceID))
			Expect(resp.DisplayName).To(Equal("Test Bank Account"))
			Expect(resp.DisplayDescription).To(Equal("Main checking account"))
			Expect(resp.CreateTime).NotTo(BeNil())
			Expect(resp.UpdateTime).NotTo(BeNil())
		})

		It("returns InvalidArgument when transaction account body is missing", func() {
			_, err := TransactionAccountClient.CreateTransactionAccount(ctx, &gen.CreateTransactionAccountRequest{
				Parent: orgName,
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})

		It("returns InvalidArgument when import_source_id is invalid", func() {
			_, err := TransactionAccountClient.CreateTransactionAccount(ctx, &gen.CreateTransactionAccountRequest{
				Parent: orgName,
				TransactionAccount: &gen.TransactionAccount{
					Code:           "TEST",
					ImportSourceId: "invalid-uuid",
				},
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})
	})

	Describe("GetTransactionAccount", func() {
		var created *gen.TransactionAccount

		BeforeEach(func() {
			var err error
			created, err = TransactionAccountClient.CreateTransactionAccount(ctx, &gen.CreateTransactionAccountRequest{
				Parent: orgName,
				TransactionAccount: &gen.TransactionAccount{
					Code:           "GET-TEST",
					ImportSourceId: importSourceID,
					DisplayName:    "Get Test Account",
				},
			})
			Expect(err).NotTo(HaveOccurred())
		})

		It("retrieves the transaction account by resource name", func() {
			resp, err := TransactionAccountClient.GetTransactionAccount(ctx, &gen.GetTransactionAccountRequest{Name: created.Name})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.Name).To(Equal(created.Name))
			Expect(resp.Uid).To(Equal(created.Uid))
			Expect(resp.DisplayName).To(Equal("Get Test Account"))
		})

		It("returns NotFound for an unknown resource name", func() {
			_, err := TransactionAccountClient.GetTransactionAccount(ctx, &gen.GetTransactionAccountRequest{
				Name: "organizations/00000000-0000-0000-0000-000000000000/transactionAccounts/00000000-0000-0000-0000-000000000000",
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})

		It("returns InvalidArgument for a malformed resource name", func() {
			_, err := TransactionAccountClient.GetTransactionAccount(ctx, &gen.GetTransactionAccountRequest{Name: "not-valid"})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})
	})

	Describe("ListTransactionAccounts", func() {
		BeforeEach(func() {
			for _, code := range []string{"ACC-001", "ACC-002", "ACC-003"} {
				_, err := TransactionAccountClient.CreateTransactionAccount(ctx, &gen.CreateTransactionAccountRequest{
					Parent: orgName,
					TransactionAccount: &gen.TransactionAccount{
						Code:           code,
						ImportSourceId: importSourceID,
						DisplayName:    code,
					},
				})
				Expect(err).NotTo(HaveOccurred())
			}
		})

		It("lists all created transaction accounts", func() {
			resp, err := TransactionAccountClient.ListTransactionAccounts(ctx, &gen.ListTransactionAccountsRequest{
				Parent:   orgName,
				PageSize: 100,
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.TotalSize).To(BeNumerically(">=", 3))
			Expect(len(resp.TransactionAccounts)).To(BeNumerically(">=", 3))
		})

		It("respects page_size and returns a next_page_token when more results exist", func() {
			resp, err := TransactionAccountClient.ListTransactionAccounts(ctx, &gen.ListTransactionAccountsRequest{
				Parent:   orgName,
				PageSize: 1,
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(len(resp.TransactionAccounts)).To(Equal(1))
			if resp.TotalSize > 1 {
				Expect(resp.NextPageToken).NotTo(BeEmpty())
			}
		})

		It("traverses all pages via page tokens", func() {
			var all []*gen.TransactionAccount
			var token string
			for {
				resp, err := TransactionAccountClient.ListTransactionAccounts(ctx, &gen.ListTransactionAccountsRequest{
					Parent:    orgName,
					PageSize:  2,
					PageToken: token,
				})
				Expect(err).NotTo(HaveOccurred())
				all = append(all, resp.TransactionAccounts...)
				if resp.NextPageToken == "" {
					break
				}
				token = resp.NextPageToken
			}
			Expect(len(all)).To(BeNumerically(">=", 3))
		})
	})

	Describe("UpdateTransactionAccount", func() {
		var created *gen.TransactionAccount

		BeforeEach(func() {
			var err error
			created, err = TransactionAccountClient.CreateTransactionAccount(ctx, &gen.CreateTransactionAccountRequest{
				Parent: orgName,
				TransactionAccount: &gen.TransactionAccount{
					Code:           "UPDATE-TEST",
					ImportSourceId: importSourceID,
					DisplayName:    "Before Update",
				},
			})
			Expect(err).NotTo(HaveOccurred())
		})

		It("updates the display name and code", func() {
			updated, err := TransactionAccountClient.UpdateTransactionAccount(ctx, &gen.UpdateTransactionAccountRequest{
				TransactionAccount: &gen.TransactionAccount{
					Name:           created.Name,
					Code:           "UPDATED-CODE",
					DisplayName:    "After Update",
					ImportSourceId: importSourceID,
				},
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(updated.DisplayName).To(Equal("After Update"))
			Expect(updated.Code).To(Equal("UPDATED-CODE"))
			Expect(updated.Name).To(Equal(created.Name))
		})

		It("returns NotFound when updating a non-existent transaction account", func() {
			_, err := TransactionAccountClient.UpdateTransactionAccount(ctx, &gen.UpdateTransactionAccountRequest{
				TransactionAccount: &gen.TransactionAccount{
					Name:        "organizations/00000000-0000-0000-0000-000000000000/transactionAccounts/00000000-0000-0000-0000-000000000000",
					Code:        "GHOST",
					DisplayName: "Ghost",
				},
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})

		It("returns InvalidArgument when transaction account body is missing", func() {
			_, err := TransactionAccountClient.UpdateTransactionAccount(ctx, &gen.UpdateTransactionAccountRequest{})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})
	})

	Describe("DeleteTransactionAccount", func() {
		var created *gen.TransactionAccount

		BeforeEach(func() {
			var err error
			created, err = TransactionAccountClient.CreateTransactionAccount(ctx, &gen.CreateTransactionAccountRequest{
				Parent: orgName,
				TransactionAccount: &gen.TransactionAccount{
					Code:           "DELETE-TEST",
					ImportSourceId: importSourceID,
					DisplayName:    "To Delete",
				},
			})
			Expect(err).NotTo(HaveOccurred())
		})

		It("permanently deletes the transaction account", func() {
			_, err := TransactionAccountClient.DeleteTransactionAccount(ctx, &gen.DeleteTransactionAccountRequest{Name: created.Name})
			Expect(err).NotTo(HaveOccurred())

			_, err = TransactionAccountClient.GetTransactionAccount(ctx, &gen.GetTransactionAccountRequest{Name: created.Name})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})

		It("returns NotFound when deleting a non-existent transaction account", func() {
			_, err := TransactionAccountClient.DeleteTransactionAccount(ctx, &gen.DeleteTransactionAccountRequest{
				Name: "organizations/00000000-0000-0000-0000-000000000000/transactionAccounts/00000000-0000-0000-0000-000000000000",
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})

		It("returns InvalidArgument for a malformed resource name", func() {
			_, err := TransactionAccountClient.DeleteTransactionAccount(ctx, &gen.DeleteTransactionAccountRequest{Name: "bad-name"})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})
	})
})
