import { Request, Response } from 'express';
import { BlockchainService } from '../blockchain/BlockchainService';

export class BlockchainController {
  private blockchainService: BlockchainService;

  constructor() {
    this.blockchainService = new BlockchainService();
  }

  async getInfo(req: Request, res: Response) {
    try {
      const info = await this.blockchainService.getInfo();

      return res.json({
        success: true,
        data: info,
      });
    } catch (error: any) {
      console.error('Get blockchain info error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar informações da blockchain.',
        error: error.message,
      });
    }
  }

  async getBagInfo(req: Request, res: Response) {
    try {
      const { bagId } = req.params;

      const info = await this.blockchainService.getBagInfo(bagId);

      return res.json({
        success: true,
        data: info,
      });
    } catch (error: any) {
      console.error('Get bag info from blockchain error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar informações da bolsa na blockchain.',
        error: error.message,
      });
    }
  }

  async verifyBag(req: Request, res: Response) {
    try {
      const { bagId } = req.params;

      const result = await this.blockchainService.verifyBag(bagId);

      return res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('Verify bag on blockchain error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar bolsa na blockchain.',
        error: error.message,
      });
    }
  }
}
