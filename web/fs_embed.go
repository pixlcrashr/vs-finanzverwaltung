//go:build web

package web

import (
	"embed"
	"io/fs"
)

//go:embed all:dist/web/browser
var webFS embed.FS

// FS returns the embedded web application file system.
// Returns nil if the dist directory does not exist or is empty.
func FS() fs.FS {
	sub, err := fs.Sub(webFS, "dist/web/browser")
	if err != nil {
		return nil
	}
	return sub
}
