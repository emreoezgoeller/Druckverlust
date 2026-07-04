// Druckverlust Pro – InterpolationEngine
// Lineare Interpolation zwischen zwei Tabellenpunkten.

export class InterpolationEngine {

    static linear(x1, y1, x2, y2, x) {

        x1 = Number(x1);
        y1 = Number(y1);
        x2 = Number(x2);
        y2 = Number(y2);
        x = Number(x);

        if (x1 === x2) {
            return y1;
        }

        return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);

    }

}

export default InterpolationEngine;