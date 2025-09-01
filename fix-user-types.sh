#!/bin/bash

# Fix all user objects in ProtectedRoute test by adding 'as any' type assertion
file="/Users/danielbarreto/Development/workspace/ia/jung-edu-app/src/tests/components/ProtectedRoute.focused.test.tsx"

# Replace all instances where a user object ends with a role and closing brace
sed -i.bak -E 's/          role: UserRole\.(ADMIN|STUDENT|INSTRUCTOR|GUEST|SUPER_ADMIN)$/          role: UserRole.\1/g' "$file"
sed -i.bak2 -E 's/        },$/        } as any,/g' "$file"

echo "Fixed user object types in $file"