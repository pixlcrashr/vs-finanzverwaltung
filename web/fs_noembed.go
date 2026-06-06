//go:build !web

package web

import "io/fs"

// FS returns nil when the web application is not embedded.
func FS() fs.FS {
	return nil
}
