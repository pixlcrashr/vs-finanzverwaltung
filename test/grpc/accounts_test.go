package grpc_test

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
)

var _ = Describe("AccountService", func() {
	var ctx context.Context
	var orgName string

	BeforeEach(func() {
		ctx = context.Background()
		// Create an organization as prerequisite
		org, err := OrgClient.CreateOrganization(ctx, &gen.CreateOrganizationRequest{
			Organization: &gen.Organization{DisplayName: "Test Org for Accounts"},
		})
		Expect(err).NotTo(HaveOccurred())
		orgName = org.Name
	})

	Describe("CreateAccount", func() {
		It("creates an account and returns it with server-populated fields", func() {
			resp, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName:        "Test Account",
					DisplayCode:        "1000",
					DisplayDescription: "Test description",
					IsContainer:        false,
				},
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.Name).NotTo(BeEmpty())
			Expect(resp.Uid).NotTo(BeEmpty())
			Expect(resp.DisplayName).To(Equal("Test Account"))
			Expect(resp.DisplayCode).To(Equal("1000"))
			Expect(resp.DisplayDescription).To(Equal("Test description"))
			Expect(resp.IsContainer).To(BeFalse())
			Expect(resp.CreateTime).NotTo(BeNil())
			Expect(resp.UpdateTime).NotTo(BeNil())
		})

		It("creates a container account", func() {
			resp, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName: "Container Account",
					DisplayCode: "1000-C",
					IsContainer: true,
				},
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.IsContainer).To(BeTrue())
		})

		It("returns InvalidArgument when account body is missing", func() {
			_, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})

		It("creates a nested account with parent", func() {
			// First create parent container
			parent, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName: "Parent Container",
					DisplayCode: "1000",
					IsContainer: true,
				},
			})
			Expect(err).NotTo(HaveOccurred())

			// Then create child account
			child, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName:   "Child Account",
					DisplayCode:   "1001",
					ParentAccount: parent.Name,
				},
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(child.ParentAccount).To(Equal(parent.Name))
		})
	})

	Describe("GetAccount", func() {
		var created *gen.Account

		BeforeEach(func() {
			var err error
			created, err = AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName: "Get Account",
					DisplayCode: "2000",
				},
			})
			Expect(err).NotTo(HaveOccurred())
		})

		It("retrieves the account by resource name", func() {
			resp, err := AccountClient.GetAccount(ctx, &gen.GetAccountRequest{Name: created.Name})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.Name).To(Equal(created.Name))
			Expect(resp.Uid).To(Equal(created.Uid))
			Expect(resp.DisplayName).To(Equal("Get Account"))
		})

		It("populates parent_account for a child account", func() {
			parent, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName: "Get Parent Container",
					DisplayCode: "2000-P",
					IsContainer: true,
				},
			})
			Expect(err).NotTo(HaveOccurred())

			child, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName:   "Get Child Account",
					DisplayCode:   "2000-C",
					ParentAccount: parent.Name,
				},
			})
			Expect(err).NotTo(HaveOccurred())

			resp, err := AccountClient.GetAccount(ctx, &gen.GetAccountRequest{Name: child.Name})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.ParentAccount).To(Equal(parent.Name))
		})

		It("returns NotFound for an unknown resource name", func() {
			_, err := AccountClient.GetAccount(ctx, &gen.GetAccountRequest{
				Name: "organizations/00000000-0000-0000-0000-000000000000/accounts/00000000-0000-0000-0000-000000000000",
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})

		It("returns InvalidArgument for a malformed resource name", func() {
			_, err := AccountClient.GetAccount(ctx, &gen.GetAccountRequest{Name: "not-valid"})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})
	})

	Describe("ListAccounts", func() {
		BeforeEach(func() {
			for _, name := range []string{"Account A", "Account B", "Account C"} {
				_, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
					Parent: orgName,
					Account: &gen.Account{
						DisplayName: name,
						DisplayCode: name,
					},
				})
				Expect(err).NotTo(HaveOccurred())
			}
		})

		It("lists all created accounts", func() {
			resp, err := AccountClient.ListAccounts(ctx, &gen.ListAccountsRequest{
				Parent:   orgName,
				PageSize: 100,
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.TotalSize).To(BeNumerically(">=", 3))
			Expect(len(resp.Accounts)).To(BeNumerically(">=", 3))
		})

		It("respects page_size and returns a next_page_token when more results exist", func() {
			resp, err := AccountClient.ListAccounts(ctx, &gen.ListAccountsRequest{
				Parent:   orgName,
				PageSize: 1,
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(len(resp.Accounts)).To(Equal(1))
			if resp.TotalSize > 1 {
				Expect(resp.NextPageToken).NotTo(BeEmpty())
			}
		})

		It("traverses all pages via page tokens", func() {
			var all []*gen.Account
			var token string
			for {
				resp, err := AccountClient.ListAccounts(ctx, &gen.ListAccountsRequest{
					Parent:    orgName,
					PageSize:  2,
					PageToken: token,
				})
				Expect(err).NotTo(HaveOccurred())
				all = append(all, resp.Accounts...)
				if resp.NextPageToken == "" {
					break
				}
				token = resp.NextPageToken
			}
			Expect(len(all)).To(BeNumerically(">=", 3))
		})

		It("populates parent_account for child accounts", func() {
			parent, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName: "Parent Container",
					DisplayCode: "LIST-P",
					IsContainer: true,
				},
			})
			Expect(err).NotTo(HaveOccurred())

			_, err = AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName:   "Child Account",
					DisplayCode:   "LIST-C",
					ParentAccount: parent.Name,
				},
			})
			Expect(err).NotTo(HaveOccurred())

			resp, err := AccountClient.ListAccounts(ctx, &gen.ListAccountsRequest{
				Parent:   orgName,
				PageSize: 100,
			})
			Expect(err).NotTo(HaveOccurred())

			var child *gen.Account
			for _, a := range resp.Accounts {
				if a.DisplayName == "Child Account" {
					child = a
					break
				}
			}
			Expect(child).NotTo(BeNil())
			Expect(child.ParentAccount).To(Equal(parent.Name))
		})
	})

	Describe("ListNestedAccounts", func() {
		BeforeEach(func() {
			// Create parent container
			parent, err := AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName: "Root Container",
					DisplayCode: "3000",
					IsContainer: true,
				},
			})
			Expect(err).NotTo(HaveOccurred())

			// Create child
			_, err = AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName:   "Child Account",
					DisplayCode:   "3001",
					ParentAccount: parent.Name,
				},
			})
			Expect(err).NotTo(HaveOccurred())
		})

		It("returns accounts in nested tree structure", func() {
			resp, err := AccountClient.ListNestedAccounts(ctx, &gen.ListNestedAccountsRequest{
				Parent: orgName,
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(len(resp.Accounts)).To(BeNumerically(">=", 1))
		})
	})

	Describe("GetNestedAccount", func() {
		var parent *gen.Account

		BeforeEach(func() {
			var err error
			parent, err = AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName: "Nested Root",
					DisplayCode: "4000",
					IsContainer: true,
				},
			})
			Expect(err).NotTo(HaveOccurred())

			_, err = AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName:   "Nested Child",
					DisplayCode:   "4001",
					ParentAccount: parent.Name,
				},
			})
			Expect(err).NotTo(HaveOccurred())
		})

		It("retrieves account with its nested children", func() {
			resp, err := AccountClient.GetNestedAccount(ctx, &gen.GetNestedAccountRequest{
				Name: parent.Name,
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.Account).NotTo(BeNil())
			Expect(resp.Account.Account).NotTo(BeNil())
			Expect(resp.Account.Account.Name).To(Equal(parent.Name))
		})

		It("returns NotFound for unknown account", func() {
			_, err := AccountClient.GetNestedAccount(ctx, &gen.GetNestedAccountRequest{
				Name: "organizations/00000000-0000-0000-0000-000000000000/accounts/00000000-0000-0000-0000-000000000000",
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})
	})

	Describe("UpdateAccount", func() {
		var created *gen.Account

		BeforeEach(func() {
			var err error
			created, err = AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName: "Before Update",
					DisplayCode: "5000",
				},
			})
			Expect(err).NotTo(HaveOccurred())
		})

		It("updates the display name and code", func() {
			updated, err := AccountClient.UpdateAccount(ctx, &gen.UpdateAccountRequest{
				Account: &gen.Account{
					Name:        created.Name,
					DisplayName: "After Update",
					DisplayCode: "5001",
				},
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(updated.DisplayName).To(Equal("After Update"))
			Expect(updated.DisplayCode).To(Equal("5001"))
			Expect(updated.Name).To(Equal(created.Name))
		})

		It("returns NotFound when updating a non-existent account", func() {
			_, err := AccountClient.UpdateAccount(ctx, &gen.UpdateAccountRequest{
				Account: &gen.Account{
					Name:        "organizations/00000000-0000-0000-0000-000000000000/accounts/00000000-0000-0000-0000-000000000000",
					DisplayName: "Ghost",
				},
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})

		It("returns InvalidArgument when account body is missing", func() {
			_, err := AccountClient.UpdateAccount(ctx, &gen.UpdateAccountRequest{})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})
	})

	Describe("ArchiveAccount", func() {
		var created *gen.Account

		BeforeEach(func() {
			var err error
			created, err = AccountClient.CreateAccount(ctx, &gen.CreateAccountRequest{
				Parent: orgName,
				Account: &gen.Account{
					DisplayName: "To Archive",
					DisplayCode: "6000",
				},
			})
			Expect(err).NotTo(HaveOccurred())
		})

		It("archives the account (soft delete)", func() {
			resp, err := AccountClient.ArchiveAccount(ctx, &gen.ArchiveAccountRequest{Name: created.Name})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.IsArchived).To(BeTrue())

			// Should still be retrievable by default
			getResp, err := AccountClient.GetAccount(ctx, &gen.GetAccountRequest{Name: created.Name})
			Expect(err).NotTo(HaveOccurred())
			Expect(getResp.IsArchived).To(BeTrue())
		})

		It("returns NotFound when archiving a non-existent account", func() {
			_, err := AccountClient.ArchiveAccount(ctx, &gen.ArchiveAccountRequest{
				Name: "organizations/00000000-0000-0000-0000-000000000000/accounts/00000000-0000-0000-0000-000000000000",
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})
	})

})
