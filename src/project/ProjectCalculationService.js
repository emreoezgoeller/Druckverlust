import { calculateProject } from "../core/CalculationEngine.js";
import ValidationEngine from "../validation/ValidationEngine.js";

export default class ProjectCalculationService {

    static calculate(project) {

        // Projekt prüfen
        const validation =
            ValidationEngine.validateProject(project);

        // Berechnung durchführen
        const calculation =
            calculateProject(project);

        return {

            project,

            validation,

            calculation,

            timestamp: new Date().toISOString()

        };

    }

}