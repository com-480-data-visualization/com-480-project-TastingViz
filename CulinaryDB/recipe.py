import pandas as pd
import json

# Load data
details = pd.read_csv('CulinaryDB/01_Recipe_Details.csv')  # Contains Recipe ID, Title, and Cuisine
ingredients = pd.read_csv('CulinaryDB/04_Recipe-Ingredients_Aliases.csv')  # Contains Recipe ID and Aliased Ingredient Name

# Clean up whitespace and lowercase ingredient names
ingredients['Aliased Ingredient Name'] = ingredients['Aliased Ingredient Name'].str.strip().str.lower()

# Merge details with ingredients on Recipe ID
merged = pd.merge(
    ingredients,
    details[['Recipe ID', 'Title', 'Cuisine']],  # Merge with Title and Cuisine from the other file
    on='Recipe ID'
)

# Group by Recipe ID, Title, and Cuisine, and collect ingredients
grouped = (
    merged.groupby(['Recipe ID', 'Title', 'Cuisine'])
    .agg({'Aliased Ingredient Name': list})  # Collect ingredients as a list
    .reset_index()
)

# Convert to list of dicts and rename columns for clarity
recipes = grouped.rename(columns={
    'Aliased Ingredient Name': 'Aliased Ingredients'
}).to_dict(orient='records')

# Output to JSON
with open('recipes_with_ingredients.json', 'w') as f:
    json.dump(recipes, f, indent=2)

