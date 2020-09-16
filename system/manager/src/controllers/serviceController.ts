import { Router } from 'express';

import { changeTheme, rebuildTheme } from '../managers/baseManager';
import { ManagerState } from '../managerState';
import { getAllServices } from '../utils/cacheManager';


export const getServiceController = (): Router => {

    const serviceController = Router();

    /**
      * @swagger
      * 
      * /services:
      *   get:
      *     description: Returns list of currently runnig services
      *     tags: 
      *       - Services
      *     produces:
      *       - application/json
      *     responses:
      *       200:
      *         description: list of currently runnig services
      */
    serviceController.get(`/`, function (req, res) {
        getAllServices((cache) => {
            res.send(cache);
        });
    });


    /**
      * @swagger
      * 
      * /services/change-theme/{themeName}:
      *   get:
      *     description: Changes current theme for Renderer and AdminPanel services
      *     tags: 
      *       - Services
      *     produces:
      *       - application/json
      *     parameters:
      *       - name: themeName
      *         description: Name of a new theme to change
      *         in: path
      *         required: true
      *         type: string
      *     responses:
      *       200:
      *         description: true
      */
    serviceController.get(`/change-theme/:themeName`, function (req, res) {
        const themeName = req.params.themeName;
        if (themeName && themeName !== '') {
            ManagerState.clearLog();
            changeTheme(themeName, (success) => {
                res.send(success);
            }, ManagerState.getLogger('base', true));
        } else {
            res.send(false);
        }
    });

    /**
      * @swagger
      * 
      * /services/rebuild-theme:
      *   get:
      *     description: Rebulds current theme for Renderer and AdminPanel services
      *     tags: 
      *       - Services
      *     produces:
      *       - application/json
      *     responses:
      *       200:
      *         description: true
      */
    serviceController.get(`/rebuild-theme`, function (req, res) {
        ManagerState.clearLog();
        rebuildTheme((success) => {
            res.send(success);
        }, ManagerState.getLogger('base', true));
    });

    return serviceController;
}