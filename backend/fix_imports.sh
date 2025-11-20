#!/bin/bash

# Script to add missing JPA imports to entity files

# Define the imports we need to ensure exist
IMPORTS=(
    "jakarta.persistence.Index"
    "jakarta.persistence.UniqueConstraint"
    "jakarta.persistence.PrePersist"
    "jakarta.persistence.PreUpdate"
    "jakarta.persistence.JoinTable"
    "jakarta.persistence.ForeignKey"
)

# Process each Java file in the entity directory
for file in src/main/java/com/ultrabms/entity/*.java; do
    echo "Processing $file..."

    # Check if file uses any JPA annotations
    for import in "${IMPORTS[@]}"; do
        # Extract the annotation name from the import (last part after .)
        annotation=$(echo "$import" | awk -F. '{print $NF}')

        # Check if the file uses this annotation but doesn't have the import
        if grep -q "@$annotation" "$file" && ! grep -q "import $import" "$file"; then
            echo "  Adding import $import to $file"

            # Find the last import line
            last_import_line=$(grep -n "^import jakarta.persistence" "$file" | tail -1 | cut -d: -f1)

            if [ -n "$last_import_line" ]; then
                # Add the import after the last jakarta.persistence import
                sed -i '' "${last_import_line}a\\
import $import;
" "$file"
            fi
        fi
    done
done

echo "Import fixing complete!"
