package grpc_test

import (
	"context"

	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	gen "github.com/pixlcrashr/vsfv/pkg/grpc/gen"
)

var _ = Describe("OrganizationService", func() {
	var ctx context.Context

	BeforeEach(func() {
		ctx = context.Background()
	})

	Describe("CreateOrganization", func() {
		It("creates an organization and returns it with server-populated fields", func() {
			resp, err := OrgClient.CreateOrganization(ctx, &gen.CreateOrganizationRequest{
				Organization: &gen.Organization{
					DisplayName: "Test Org",
				},
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.Name).NotTo(BeEmpty())
			Expect(resp.Uid).NotTo(BeEmpty())
			Expect(resp.DisplayName).To(Equal("Test Org"))
			Expect(resp.CreateTime).NotTo(BeNil())
			Expect(resp.UpdateTime).NotTo(BeNil())
		})

		It("returns InvalidArgument when organization body is missing", func() {
			_, err := OrgClient.CreateOrganization(ctx, &gen.CreateOrganizationRequest{})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})
	})

	Describe("GetOrganization", func() {
		var created *gen.Organization

		BeforeEach(func() {
			var err error
			created, err = OrgClient.CreateOrganization(ctx, &gen.CreateOrganizationRequest{
				Organization: &gen.Organization{DisplayName: "Get Org"},
			})
			Expect(err).NotTo(HaveOccurred())
		})

		It("retrieves the organization by resource name", func() {
			resp, err := OrgClient.GetOrganization(ctx, &gen.GetOrganizationRequest{Name: created.Name})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.Name).To(Equal(created.Name))
			Expect(resp.Uid).To(Equal(created.Uid))
			Expect(resp.DisplayName).To(Equal("Get Org"))
		})

		It("returns NotFound for an unknown resource name", func() {
			_, err := OrgClient.GetOrganization(ctx, &gen.GetOrganizationRequest{
				Name: "organizations/00000000-0000-0000-0000-000000000000",
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})

		It("returns InvalidArgument for a malformed resource name", func() {
			_, err := OrgClient.GetOrganization(ctx, &gen.GetOrganizationRequest{Name: "not-valid"})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})
	})

	Describe("ListOrganizations", func() {
		BeforeEach(func() {
			for _, name := range []string{"Alpha", "Beta", "Gamma"} {
				_, err := OrgClient.CreateOrganization(ctx, &gen.CreateOrganizationRequest{
					Organization: &gen.Organization{DisplayName: name},
				})
				Expect(err).NotTo(HaveOccurred())
			}
		})

		It("lists all created organizations", func() {
			resp, err := OrgClient.ListOrganizations(ctx, &gen.ListOrganizationsRequest{PageSize: 100})
			Expect(err).NotTo(HaveOccurred())
			Expect(resp.TotalSize).To(BeNumerically(">=", 3))
			Expect(len(resp.Organizations)).To(BeNumerically(">=", 3))
		})

		It("respects page_size and returns a next_page_token when more results exist", func() {
			resp, err := OrgClient.ListOrganizations(ctx, &gen.ListOrganizationsRequest{PageSize: 1})
			Expect(err).NotTo(HaveOccurred())
			Expect(len(resp.Organizations)).To(Equal(1))
			if resp.TotalSize > 1 {
				Expect(resp.NextPageToken).NotTo(BeEmpty())
			}
		})

		It("traverses all pages via page tokens", func() {
			var all []*gen.Organization
			var token string
			for {
				resp, err := OrgClient.ListOrganizations(ctx, &gen.ListOrganizationsRequest{
					PageSize:  2,
					PageToken: token,
				})
				Expect(err).NotTo(HaveOccurred())
				all = append(all, resp.Organizations...)
				if resp.NextPageToken == "" {
					break
				}
				token = resp.NextPageToken
			}
			Expect(len(all)).To(BeNumerically(">=", 3))
		})
	})

	Describe("UpdateOrganization", func() {
		var created *gen.Organization

		BeforeEach(func() {
			var err error
			created, err = OrgClient.CreateOrganization(ctx, &gen.CreateOrganizationRequest{
				Organization: &gen.Organization{DisplayName: "Before Update"},
			})
			Expect(err).NotTo(HaveOccurred())
		})

		It("updates the display name", func() {
			updated, err := OrgClient.UpdateOrganization(ctx, &gen.UpdateOrganizationRequest{
				Organization: &gen.Organization{
					Name:        created.Name,
					DisplayName: "After Update",
				},
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(updated.DisplayName).To(Equal("After Update"))
			Expect(updated.Name).To(Equal(created.Name))
		})

		It("returns NotFound when updating a non-existent organization", func() {
			_, err := OrgClient.UpdateOrganization(ctx, &gen.UpdateOrganizationRequest{
				Organization: &gen.Organization{
					Name:        "organizations/00000000-0000-0000-0000-000000000000",
					DisplayName: "Ghost",
				},
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})

		It("returns InvalidArgument when organization body is missing", func() {
			_, err := OrgClient.UpdateOrganization(ctx, &gen.UpdateOrganizationRequest{})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})
	})

	Describe("DeleteOrganization", func() {
		var created *gen.Organization

		BeforeEach(func() {
			var err error
			created, err = OrgClient.CreateOrganization(ctx, &gen.CreateOrganizationRequest{
				Organization: &gen.Organization{DisplayName: "To Delete"},
			})
			Expect(err).NotTo(HaveOccurred())
		})

		It("deletes the organization and makes it unretrievable", func() {
			_, err := OrgClient.DeleteOrganization(ctx, &gen.DeleteOrganizationRequest{Name: created.Name})
			Expect(err).NotTo(HaveOccurred())

			_, err = OrgClient.GetOrganization(ctx, &gen.GetOrganizationRequest{Name: created.Name})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})

		It("returns NotFound when deleting a non-existent organization", func() {
			_, err := OrgClient.DeleteOrganization(ctx, &gen.DeleteOrganizationRequest{
				Name: "organizations/00000000-0000-0000-0000-000000000000",
			})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.NotFound))
		})

		It("returns InvalidArgument for a malformed resource name", func() {
			_, err := OrgClient.DeleteOrganization(ctx, &gen.DeleteOrganizationRequest{Name: "bad-name"})
			Expect(err).To(HaveOccurred())
			Expect(status.Code(err)).To(Equal(codes.InvalidArgument))
		})
	})
})
