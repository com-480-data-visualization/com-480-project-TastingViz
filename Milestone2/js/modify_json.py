import json

with open("Milestone2/js/recipes_with_ingredients.json", 'r') as file:
    data = json.load(file)

for recipe in data:
    if "Aliased Ingredients" in recipe:
        unique_ingredients = list(set(recipe["Aliased Ingredients"]))
        unique_ingredients.sort()  
        recipe["Aliased Ingredients"] = unique_ingredients

with open('Milestone2/js/recipes_with_ingredient.json', 'w') as file:
    json.dump(data, file, indent=2)
