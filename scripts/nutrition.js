function estimateFiberPer100g(food) {
    const name = food.name.toLowerCase();

    if (food.category === "Vegetable") {
        return 3;
    }
    if (food.category === "Fat") {
        if (name.includes("oil") || name.includes("butter") || name.includes("ghee") || name.includes("mayonnaise")) {
            return 0;
        }
        return 7;
    }
    if (food.category === "Dairy" || food.dietType === "non-veg") {
        return 0;
    }
    if (name.includes("bean") || name.includes("lentil") || name.includes("chickpea") || name.includes("dal")) {
        return 7;
    }
    if (name.includes("oat") || name.includes("whole wheat") || name.includes("barley") || name.includes("quinoa")) {
        return 8;
    }
    if (name.includes("fruit") || name.includes("apple") || name.includes("banana") || name.includes("orange") || name.includes("mango") || name.includes("berry") || name.includes("grape")) {
        return 2.5;
    }
    return 1.5;
}

function getFiberPer100g(food) {
    return Number.isFinite(Number(food.fiberPer100g)) ? Number(food.fiberPer100g) : estimateFiberPer100g(food);
}

function calculateNutrition(food, quantityInGrams) {
    const multiplier = quantityInGrams / 100;

    const protein = food.proteinPer100g * multiplier;
    const carbs = food.carbsPer100g * multiplier;
    const fat = food.fatPer100g * multiplier;
    const fiber = getFiberPer100g(food) * multiplier;

    return {
        name: food.name,
        quantityInGrams: quantityInGrams,

        // Fiber contributes 2 kcal per gram
        calories: (protein * 4) + (carbs * 4) + (fat * 9) + (fiber * 2),

        protein: protein,
        carbs: carbs,
        fat: fat,
        fiber: fiber
    };
}


function getServingSizes(food) {
    const name = food.name.toLowerCase();

    if (name.includes("psyllium")) {
        return [5, 10, 15, 20];
    }

    if (food.category === "Protein") {
        if (name.includes("egg")) {
            return [50, 100, 150, 200];
        }
        if (name.includes("powder") || name.includes("whey")) {
            return [20, 25, 30, 35, 40, 50];
        }
        if (name.includes("lentil") || name.includes("bean") || name.includes("chickpea") || name.includes("dal") || name.includes("edamame")) {
            return [100, 125, 150, 175, 200, 250];
        }
       return [100, 125, 150, 175, 200, 225, 250, 275, 300];
    }

    if (food.category === "Carbs") {
        if (name.includes("oat")) {
            return [40, 50, 60, 75, 80, 100];
        }
        if (name.includes("bread") || name.includes("tortilla") || name.includes("roti")) {
            return [50, 75, 100, 125, 150, 175];
        }
        if (name.includes("banana") || name.includes("apple") || name.includes("orange") || name.includes("mango") || name.includes("grape")) {
            return [75, 100, 125, 150, 200];
        }
        return [100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500]; 
     }

    if (food.category === "Fat") {
    if (name.includes("oil") || name.includes("ghee") || name.includes("butter")) {
        return [5, 10, 15, 20, 25, 30, 35];
    }
    if (name.includes("nut") || name.includes("almond") || name.includes("peanut") || name.includes("seed") || name.includes("tahini")) {
        return [15, 20, 25, 30, 40, 50, 60];
    }
    return [25, 50, 75, 100, 125];
}

    if (food.category === "Dairy") {
        return [100, 125, 150, 175, 200, 250];
    }

    return [50, 100, 150, 200];
}

function getSearchServingSizes(food) {
    const servingSizes = getServingSizes(food);
    const candidateIndexes = [0, Math.floor((servingSizes.length - 1) / 2), servingSizes.length - 1];

    return candidateIndexes.filter(function (index, position, indexes) {
        return indexes.indexOf(index) === position;
    }).map(function (index) {
        return servingSizes[index];
    });
}

